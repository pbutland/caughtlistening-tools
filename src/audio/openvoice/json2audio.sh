#!/bin/bash -x

# Converts JSON file to audio
# Expected input: <params> 
# e.g. ./json2audio.sh '-w 1 -v v2 -o ./data/240509 240509.json'
#
# If the python script does not exit successfully, this script will sleep for 30 seconds and start the python script again
#

if [[ $# -eq 0 ]] ; then
    echo 'Usage: json2audio.sh <params>'
    exit 0
fi

PARAMS=$1

status=1
while [ $status -ne 0 ]
do
  python json2audio.py $PARAMS
  status=$?
  [ $status -ne 0 ] && echo 'Sleeping for 30 seconds and then restarting...' && sleep 30
done