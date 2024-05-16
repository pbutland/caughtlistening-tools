import logging
import argparse
import json
import re
import os
import concurrent.futures
import torch
import nltk
from itertools import groupby
from pathlib import Path
from openvoice import se_extractor
from openvoice.api import BaseSpeakerTTS, ToneColorConverter
from melo.api import TTS

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("json2audio.log"),
        logging.StreamHandler()
    ]
)

nltk.download('punkt')

class Details():
    filename = ''
    reference_speaker = ''
    text = ''

    def __init__(self, filename, reference_speaker, text):
        self.filename = filename
        self.reference_speaker = reference_speaker
        self.text = text

parser = argparse.ArgumentParser(prog='json2audio', description='Converts JSON file(s) to audio')
parser.add_argument('files', help='JSON file(s) to generate audio files from', type=str, nargs='+')
parser.add_argument('-v', '--version', help='OpenVoice version', default='v1', choices=['v1', 'v2'])
parser.add_argument('-w', '--workers', help='Number of workers', default=3, type=int)
parser.add_argument('-o', '--output', help='Output directory for generated audio files', default='data/output')
parser.add_argument('-r', '--reference', help='Directory for reference files', default='data/reference')
parser.add_argument('-e', '--extension', help='File extension to use for generated audio files', default='wav')
parser.add_argument('-c', '--clean', help='Delete files from output directory before execution', action='store_true')
args = parser.parse_args()

ext = f'.{args.extension}'
output_dir = args.output
reference_dir = args.reference

os.makedirs(output_dir, exist_ok=True)
if (args.clean):
    for f in os.listdir(output_dir):
        os.remove(f'{output_dir}/{f}')

ckpt_base = 'checkpoints/base_speakers/EN'
ckpt_converter = 'checkpoints/converter'

device='cuda:0' if torch.cuda.is_available() else 'cpu'

# v2
if args.version == 'v2':
    ckpt_converter = 'checkpoints_v2/converter'
else:
    base_speaker_tts = BaseSpeakerTTS(f'{ckpt_base}/config.json', device=device)
    base_speaker_tts.load_ckpt(f'{ckpt_base}/checkpoint.pth')

tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')

encode_message = '@MyShell'

page_regex = re.compile(r'^Page ', re.IGNORECASE)

def key_func(k):
    return k['voice']

data = []
logger.info(f'Processing {len(args.files)} files')
for file in args.files:
    logger.info(f'Processing {file}')
    f = open (file, 'r')
    data = data + json.loads(f.read())
    f.close()

data = filter(lambda x: 'text' in x, data)
data = sorted(data, key=key_func)

audio_details = []
reference_speakers = []
reference_targets = {}
for key, value in groupby(data, key_func):
    # find voice reference file
    reference_speaker = reference_dir
    for filename in os.listdir(reference_dir):
        if re.match(fr'{key}.*.mp3', filename): # This is the voice you want to clone
            reference_speaker = os.path.join(reference_dir, filename)

    reference_speakers.append(reference_speaker)

    items = list(value)
    for item in items:
        page = page_regex.sub('', item['page'])
        text = item['text']
        sentences = nltk.sent_tokenize(text) # this gives us a list of sentences
        sentenceNumber = 1
        # now loop over each sentence
        for sentence in sentences:
            filename = '%s-%s-%s-%s' % (Path(file).stem, page, item['lineNumber'].zfill(2), str(sentenceNumber).zfill(3))

            save_path_prefix = f'{output_dir}/{filename}'
            audio_details.append(Details(save_path_prefix, reference_speaker, sentence))
            sentenceNumber += 1

speaker_progress = 0
num_speakers = len(reference_speakers)
audio_progress = 0
num_sentences = len(audio_details)

def generate_targets(speaker):
    logger.info(f'Generating clone from speaker {speaker}')
    if args.version == 'v1':
        # v1
        target_se, audio_name = se_extractor.get_se(speaker, tone_color_converter, target_dir='processed', vad=True)
    else:
        # v2
        target_se, audio_name = se_extractor.get_se(speaker, tone_color_converter, vad=False)
    logger.info(f'Adding speaker {speaker} {audio_name}')
    reference_targets[speaker] = target_se, audio_name
    return speaker

logger.info(f'Total speakers: {num_speakers}')
with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
    future_to_generate = {executor.submit(generate_targets, speaker): speaker for speaker in reference_speakers}
    for future in concurrent.futures.as_completed(future_to_generate):
        item = future_to_generate[future]
        try:
            data = future.result()
            # TODO: increment progress
        except Exception as exc:
            logger.error('%r generated an exception: %s' % (item, exc))
        else:
            speaker_progress += 1
            logger.info(f'Generated voice {data} ({speaker_progress/num_speakers:.2%})')

def generate(item):
    logger.info(f'Generating {item.filename} {item.reference_speaker} {item.text}')
    src_path = f'{item.filename}-tmp{ext}'
    save_path = f'{item.filename}{ext}'
    if os.path.exists(save_path):
        logger.warn(f'Output file {save_path} already exists. Skipping!')
        return item

    logger.info(f'Getting speaker {item.reference_speaker}')
    target_se, audio_name = reference_targets[item.reference_speaker]

    if args.version == 'v1':
        # v1
        # Run the base speaker tts
        base_speaker_tts.tts(item.text, src_path, speaker='default', language='English', speed=1.0)
        source_se = torch.load(f'{ckpt_base}/en_default_se.pth').to(device)
    else:
        # v2
        speed = 1.0
        language = 'EN_NEWEST' # EN_US
        model = TTS(language=language, device=device)
        speaker_ids = model.hps.data.spk2id
        speaker_key = list(speaker_ids.keys())[0] # only fetch the first speaker_id - not interested in others
        speaker_id = speaker_ids[speaker_key]
        speaker_key = speaker_key.lower().replace('_', '-')
        source_se = torch.load(f'checkpoints_v2/base_speakers/ses/{speaker_key}.pth', map_location=device)
        model.tts_to_file(item.text, speaker_id, src_path, speed=speed)

    # Run the tone color converter
    tone_color_converter.convert(
        audio_src_path=src_path, 
        src_se=source_se, 
        tgt_se=target_se, 
        output_path=save_path,
        message=encode_message)

    if os.path.isfile(src_path):
        os.remove(src_path)
    return save_path

logger.info(f'Total sentences: {num_sentences}')
with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
    future_to_generate = {executor.submit(generate, detail): detail for detail in audio_details}
    for future in concurrent.futures.as_completed(future_to_generate):
        item = future_to_generate[future]
        try:
            data = future.result()
            #increment progress
        except Exception as exc:
            logger.error('%r generated an exception: %s' % (item, exc))
        else:
            audio_progress += 1
            logger.info(f'Generated {data} ({audio_progress/num_sentences:.2%})')