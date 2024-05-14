import argparse
import json
import re
import os
import torch
import nltk
from openvoice import se_extractor
from openvoice.api import BaseSpeakerTTS, ToneColorConverter
from itertools import groupby
from pathlib import Path
from melo.api import TTS

nltk.download('punkt')

v2 = False

parser = argparse.ArgumentParser(prog='json2audio', description='Converts JSON file(s) to audio')
parser.add_argument('files', help='JSON file(s) to generate audio files from', type=str, nargs='+')
parser.add_argument('-v', '--version', help='OpenVoice version', default='v1', choices=['v1', 'v2'])
args = parser.parse_args()

ckpt_base = 'checkpoints/base_speakers/EN'
ckpt_converter = 'checkpoints/converter'

device="cuda:0" if torch.cuda.is_available() else "cpu"
output_dir = 'data/output'
reference_dir = 'data/reference'

# v2
if args.version == 'v2':
    ckpt_converter = 'checkpoints_v2/converter'

base_speaker_tts = BaseSpeakerTTS(f'{ckpt_base}/config.json', device=device)
base_speaker_tts.load_ckpt(f'{ckpt_base}/checkpoint.pth')

tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')

os.makedirs(output_dir, exist_ok=True)

source_se = torch.load(f'{ckpt_base}/en_default_se.pth').to(device)

encode_message = "@MyShell"

regex = re.compile(r"^Page ", re.IGNORECASE)

# define a function for key
def key_func(k):
    return k['voice']

data = []
print("Processing %d files" % (len(args.files)))
for file in args.files:
    print("Processing %s" % (file))
    f = open (file, "r")
    data = data + json.loads(f.read())

data = filter(lambda x: "text" in x, data)
data = sorted(data, key=key_func)

numItems = 0;
for key, value in groupby(data, key_func):
    items = list(value)
    numItems += len(items)

print("Number of text elements %d" % (numItems))
progress = 0
for key, value in groupby(data, key_func):
    # find voice reference file
    reference_speaker = reference_dir
    for filename in os.listdir(reference_dir):
        if re.match(fr'{key}.*.mp3', filename): # This is the voice you want to clone
            reference_speaker = os.path.join(reference_dir, filename)

    print("Generating audio for %s using %s" % (key, reference_speaker))
    if args.version == 'v1':
        # v1
        target_se, audio_name = se_extractor.get_se(reference_speaker, tone_color_converter, target_dir='processed', vad=True)
    else:
        # v2
        target_se, audio_name = se_extractor.get_se(reference_speaker, tone_color_converter, vad=False)

    items = list(value)
    for item in items:
        page = regex.sub("p", item['page'])
        text = item['text']
        sentences = nltk.sent_tokenize(text) # this gives us a list of sentences
        sentenceNumber = 1
        # now loop over each sentence
        for sentence in sentences:
            filename = "%s-%s-%s-%s.wav" % (Path(file).stem, page, item['lineNumber'].zfill(2), str(sentenceNumber).zfill(3))
            print("Outputting to %s" % filename)
            print("Processing text for %s: %s" % (key, sentence))

            save_path = f'{output_dir}/{filename}'
            if os.path.exists(save_path):
                continue

            src_path = f'{output_dir}/tmp.wav'

            if args.version == 'v1':
                # v1
                # Run the base speaker tts
                base_speaker_tts.tts(sentence, src_path, speaker='default', language='English', speed=1.0)
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
                model.tts_to_file(sentence, speaker_id, src_path, speed=speed)

            # Run the tone color converter
            tone_color_converter.convert(
                audio_src_path=src_path, 
                src_se=source_se, 
                tgt_se=target_se, 
                output_path=save_path,
                message=encode_message)

            sentenceNumber += 1
            f.close()
        progress += 1
        print(f"Progress {progress/numItems:.2%}")
os.remove(f'{output_dir}/tmp.wav')