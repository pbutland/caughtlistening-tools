# caughtlistening-tools

A set of tools to transform transcript data from the Trump criminal case (indictment # 71543-2023), published on the [New York State Unified Court System](https://ww2.nycourts.gov/press/index.shtml) website.

Data produced from these tools can be found at the [caughtlistening](https://pbutland.github.io/caughtlistening/) website.

## Setup

* Install [Node.js](https://nodejs.org/)
* Install [Yarn](https://yarnpkg.com/)
* Execute `yarn install`

## Complete conversion process

The diagram below depicts the entire transformation process from HTML to MP3, with optional PDF and TXT outputs too.

All steps in the process (except for the audio generation and PDF to text) can be executed by the following command:
```
convert.sh <inputDir>
```

```
                       ┌───────┐
                       │ HTML  │
                       └───────┘
                           |
                           |
                       (html2png)
                           |
                           V
                       ┌───────┐
                       │  PNG  │
                       └───────┘
                           |
                           |
                       (png2txt)
                           |
                           V
┌───────┐              ┌───────┐              ┌───────┐
│  PDF  │──(pdf2txt)──>│  TXT  │──(png2txt)──>│  PDF  │
└───────┘              └───────┘              └───────┘
                           |
                           |
                       (txt2json)
                           |
                           V
                       ┌───────┐               ┌───────┐
                       │ JSON  │──(json2txt)──>│  TXT  │
                       └───────┘               └───────┘
                           |
                           |
                       (json2mp3)
                           |
                           V
                       ┌───────┐
                       │  MP3  │
                       └───────┘
```

## PDF to text

The original HTML transcripts are slowly being replaced by PDF versions.  This tool converts a PDF into the same text
format that the OCR process does, so that the rest of the pipeline can use it.

```
yarn pdf2txt --help
```

E.g.
```
yarn pdf2txt -o ./output input.pdf
```

## Extract image from html

A utility to extract image(s) from html file(s) and creates an image file for each html file provided as an argument.

```
yarn html2png --help
```

E.g.
```
yarn html2png -o ./output *.html
```

## Convert image to text

A utility to convert the text in image file(s) and creates a text file for each image file provided as an argument.

```
yarn png2txt --help
```

E.g.
```
yarn png2txt -o ./output *.png
```

## Covert text to PDF

A utility to convert text file(s) into a PDF file.  

```
yarn text2pdf --help
```

E.g.
```
yarn txt2pdf -o ./output/transcript.pdf *.txt
```

## Convert text to JSON

Coming soon!

### JSON structure

The JSON is an array of objects, where each object represents the words spoken by a character in the transcript along with some metadata.

Example:

```
[
  {
    "page": "Page 818",
    "lineNumber": "1",
    "character": "THE COURT:",
    "voice": "Drew",
    "text": "Good morning."
  }
]
```

## Convert json to text

A utility to convert JSON file(s) into a single formatted plain text file.  

```
yarn json2txt --help
```

E.g.
```
yarn json2txt -o ./output/transcript.txt transcript.json
```

## Covert json to mp3 audio

A utility to convert JSON file(s) into mp3 file(s). An mp3 file is created for each object in the JSON file provided as an argument. See [JSON structure](#json-structure) for information about the JSON object.  

```
yarn json2mp3 --help
```

E.g.
```
yarn json2mp3 -o ./output transcript.json
```
