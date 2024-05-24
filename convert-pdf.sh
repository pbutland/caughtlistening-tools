#!/bin/bash

# Converts PDF transcript files into JSON/TXT versions of a transcript
# Expected input: <inputPdf> <outputPath> 
# Output files:
#               <outputPath>/text
#               <outputPath>/<basename>.json
#               <outputPath>/<basename>.txt
# e.g. ./convert-pdf.sh ../caughtlistening/transcripts/4-22-2024.pdf ../caughtlistening/transcripts/data/240422
#

if [[ $# -eq 0 ]] ; then
    echo 'Usage: convert.sh <inputPdf> <outputPath>'
    exit 0
fi

PDF_FILE=$1
OUTPUT_DIR=$2
FILENAME=$(basename $OUTPUT_DIR)

# Create text from PDF
mkdir -p "$OUTPUT_DIR/text"
yarn pdf2txt -o "$OUTPUT_DIR/text" $PDF_FILE

# Create JSON from text
TXT_FILES="$OUTPUT_DIR/text/*.txt"
yarn txt2json -p -o "$OUTPUT_DIR/$FILENAME.json" $TXT_FILES

# Create text from JSON
yarn json2txt -o "$OUTPUT_DIR/$FILENAME.txt" "$OUTPUT_DIR/$FILENAME.json"
