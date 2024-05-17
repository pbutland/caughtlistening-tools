#!/bin/bash

# Converts HTML transcripts files into PDF/JSON/TXT versions of a transcript
# Expected input: <inputPath>/html 
# Output files:
#               <inputPath>/images
#               <inputPath>/text
#               <inputPath>/<basename>.pdf
#               <inputPath>/<basename>.json
#               <inputPath>/<basename>.txt
# e.g. ./convert.sh ../caughtlistening/transcripts/data/240422
#

if [[ $# -eq 0 ]] ; then
    echo 'Usage: convert.sh <inputPath>'
    exit 0
fi

INPUT_DIR=$1

# Extract images from HTML
HTML_FILES="$INPUT_DIR/html/*.html"
mkdir -p "$INPUT_DIR/images"
yarn html2png -o "$INPUT_DIR/images" $HTML_FILES

# Create text from images
PNG_FILES="$INPUT_DIR/images/*.png"
mkdir -p "$INPUT_DIR/text"
yarn png2txt -o "$INPUT_DIR/text" $PNG_FILES
rm -r "$INPUT_DIR/images"

# Create PDF from text
TXT_FILES="$INPUT_DIR/text/*.txt"
FILENAME=$(basename $INPUT_DIR)
yarn txt2pdf -o "$INPUT_DIR/$FILENAME.pdf" $TXT_FILES

# Create JSON from text
yarn txt2json -p -o "$INPUT_DIR/$FILENAME.json" $TXT_FILES

# Create text from JSON
yarn json2txt -o "$INPUT_DIR/$FILENAME.txt" "$INPUT_DIR/$FILENAME.json"
