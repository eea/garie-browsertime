#!/bin/sh
set -e


if [ -n "$CONFIG" ]; then
	echo "Found configuration variable, will write it to the /usr/src/garie-plugin/config.json"
	echo "$CONFIG" > /usr/src/garie-plugin/config.json
fi

export DBUS_SESSION_BUS_ADDRESS=/dev/null

BROWSERTIME_RECORD=/usr/src/app/bin/browsertimeWebPageReplay.js
BROWSERTIME=/usr/src/app/bin/browsertime.js

CERT_FILE=/webpagereplay/certs/wpr_cert.pem
KEY_FILE=/webpagereplay/certs/wpr_key.pem


WORKDIR_UID=$(stat -c "%u" .)
WORKDIR_GID=$(stat -c "%g" .)

# Create user with the same UID and GID as the owner of the working directory, which will be used
# to execute node. This is partly for security and partly so output files won't be owned by root.
groupadd --non-unique --gid $WORKDIR_GID browsertime
useradd --non-unique --uid $WORKDIR_UID --gid $WORKDIR_GID --home-dir /tmp browsertime


# Here's a hack for fixing the problem with Chrome not starting in time
# See https://github.com/SeleniumHQ/docker-selenium/issues/87#issuecomment-250475864
sudo rm -f /var/lib/dbus/machine-id
sudo mkdir -p /var/run/dbus
sudo service dbus restart > /dev/null
service dbus status > /dev/null
export $(dbus-launch)
export NSS_USE_SHARED_DB=ENABLED

exec "$@"
