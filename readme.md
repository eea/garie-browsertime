![reports](./screenshots/browsertime-logo.png 'Reports')

<p align="center">
  <p align="center">Tool to gather browsertime metrics and supports CRON jobs.<p>
</p>

**Highlights**

-   Poll for browsertime performance metrics on any website and stores the data into InfluxDB
-   Generates web performance videos
-   View all historic reports.
-   Setup within minutes


## Overview of garie-browsertime

Garie-browsertime was developed as a plugin for the [Garie](https://github.com/boyney123/garie) Architecture.

[Garie](https://github.com/boyney123/garie) is an out the box web performance toolkit, and `garie-browsertime` is a plugin that generates and stores browsertime data into `InfluxDB`.

`Garie-browsertime` can also be run outside the `Garie` environment and run as standalone.

If your interested in an out the box solution that supports multiple performance tools like `browsertime`, `google-speed-insight` and `lighthouse` then checkout [Garie](https://github.com/boyney123/garie).

If you want to run `garie-browsertime` standalone you can find out how below.

## Getting Started

### Prerequisites

-   Docker installed

### Running garie-browsertime

You can get setup with the basics in a few minutes.

First clone the repo.

```sh
git clone https://github.com/eea/garie-browsertime.git
```

Next setup you're config. Edit the `config.json` and add websites to the list.

```javascript
{
  "plugins":{
        "browsertime":{
            "cron": "0 */4 * * *"
        }
    },
  "urls": [
    {
      "url": "https://www.eea.europa.eu/"
    },
    {
      "url": "https://biodiversity.europa.eu/"
    }
  ]
}
```

Once you finished edited your config, lets build our docker image and setup our environment.

```sh
docker build -t garie-browsertime . && docker-compose up
```

This will build your copy of `garie-browsertime` and run the application.

On start garie-browsertime will start to gather performance metrics for the websites added to the `config.json`.

## config.json

| Property | Type                | Description                                                                          |
| -------- | ------------------- | ------------------------------------------------------------------------------------ |
| `plugins.browsertime.cron`   | `string` (optional) | Cron timer. Supports syntax can be found [here].(https://www.npmjs.com/package/cron) |
| `plugins.browsertime.retry`   | `object` (optional) | Configuration how to retry the failed tasks |
| `plugins.browsertime.retry.after`   | `number` (optional, default 30) | Minutes before we retry to execute the tasks |
| `plugins.browsertime.retry.times`   | `number` (optional, default 3) | How many time to retry to execute the failed tasks |
| `plugins.browsertime.retry.timeRange`   | `number` (optional, default 360) | Period in minutes to be checked in influx, to know if a task failed |
| `plugins.browsertime.max_age_of_report_files`   | `number` (optional, default 365) | Maximum age (in days) of report files. Any older file will be deleted. |
| `plugins.browsertime.delete_files_by_type`   | `object` (optional, no default) | Configuration for deletion of custom files. (e.g. mp4 files)  |
| `plugins.browsertime.delete_files_by_type.type`   | `string` (required for 'delete_files_by_type') | The type / extension of the files we want to delete. (e.g. "mp4"). |
| `plugins.browsertime.delete_files_by_type.age`   | `number` (required for 'delete_files_by_type') | Maximum age (in days) of the custom files. Any older file will be deleted. |
| `urls`   | `object` (required) | Config for browsertime. More detail below |

**urls object**

| Property | Type                | Description                         |
| -------- | ------------------- | ----------------------------------- |
| `url`    | `string` (required) | Url to get browsertime metrics for. |

## CPUs usage

Limiting CPU usage is done by setting the value of `cpuUsage` in the config.json.
```
"plugins":{
	"my_plugin":{
		"cron": ...,
		"cpuUsage": 0.9,
	}
}

For more information please go to the [garie-plugin](https://github.com/eea/garie-plugin) repo.

