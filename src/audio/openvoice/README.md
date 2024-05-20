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
python json2audio.py -h
```
Example:
```
python json2audio.py -c -w 5 -v v2 -o ./data/output -r ./data/reference input.json
```
The above command will clear (`-c`) the output directory `./data/output` (`-o`) before processing the file `input.json`.  It will use `./data/reference` (`-r`) as the directory containing the reference voice audio for voice cloning.  It will use the `v2` (`-v`) version of OpenVoice and will use `5` (`-w`) worker threads.

### V2 memory issue

There appears to be a memory leak with the v2 version.
The following script can be executed which allows an upper percentage of memory to be set as a threshold. The program will exit cleanly if the limit it reached, sleep for a few seconds, before starting again from where it last left off.

```
./json2audio.sh '-w 5 -v v2 -m 90 -o ./data/output -r ./data/reference input.json'
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