# OpenVoice

This sub-directory contains resources for generating audio files from transcript JSON files using [OpenVoice](https://github.com/myshell-ai/OpenVoice/blob/main/docs/USAGE.md).  See [here](https://github.com/pbutland/caughtlistening/tree/main/transcripts) for a list of available JSON files.

## Setup

* Install [OpenVoice](https://github.com/myshell-ai/OpenVoice/blob/main/docs/USAGE.md)
* Install [MeloTTS](https://github.com/myshell-ai/MeloTTS/blob/main/docs/install.md) (only needed for OpenVoice v2)
* Copy contents of this folder into your OpenVoice installation location

## Execution

Execute the following from the OpenVoice folder.

```
conda activate openvoice
python json2audio.py -v [v1|v2] *.json
```

If interrupted, execution continues from where it stopped.

For usage information, enter...
```
pythong json2audio.py -h
```

## Concatenate the generated audio files

There are two ways that are provided to concatenate all of the generated audio files.  Both approaches require [ffmpeg](https://ffmpeg.org/) to be installed.

```
./concat-audio.sh data/output transcript.wav
```
or
```
yarn merge-audio -o ./output/transcript.mp3 *.mp3
```

## Adding reference voices

All reference voices used are located under the `data/reference` folder.
The names of these files reflect the `voice` property value in the transcript JSON files.