#!/usr/bin/env bash
set -e
echo "Start getting data"
REPORTDIR=/usr/src/garie-plugin/reports

# docker_id=$( cat /proc/self/cgroup | grep :memory: | sed  's#.*/\([0-9a-fA-F]*\)$#\1#' )

# REPORTDIR=$(docker inspect $docker_id | grep :/usr/src/garie-plugin/reports | awk -F'["|:]' '{print $2}')

if [[ $2 =~ "on-demand" ]] 
then
    REPORTDIR="$REPORTDIR/on-demand/"
fi

mkdir -p $REPORTDIR

echo "Saving reports into $REPORTDIR"

echo "Getting data for: $1"
cd $REPORTDIR
hash=$(echo -n "$1" | md5sum | awk '{print $1}')  # Get the MD5 hash of the URL
unique_int=$((0x${hash:0:8}))  # Convert the first 8 characters of the hash (hex) to a decimal integer

# Map the unique integer to a display number and remote debugging port
display_number=$((1000 + unique_int % 1000))  # Map the hash to a display number (between 1000-1999)

timeout 1800 /usr/src/app/bin/browsertime.js --xvfbParams.display $display_number $1

echo "Finished getting data for: $1"

exit 0

