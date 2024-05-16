#!/bin/bash

# Concatenates all wav files in the given directory into the given output file
# e.g. ./concat-audio.sh ./data/output transcript.wav
#

if [[ $# -lt 2 ]] ; then
    echo 'Usage: concat-audio.sh <inputDir> <outputFile>'
    exit 0
fi

INPUT_DIR=$1
OUTPUT_FILE=$2

printf "file '%s'\n" $INPUT_DIR/* > wavs.txt
ffmpeg -f concat -safe 0 -i wavs.txt -acodec mp3 $OUTPUT_FILE
rm wavs.txt
