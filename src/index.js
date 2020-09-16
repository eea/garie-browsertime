const garie_plugin = require('garie-plugin')
const path = require('path');
const config = require('../config');
const express = require('express');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');
const flatten = require('flat');

const scoreKey = "browsertimeScore";
const scoreMeasurements = [
    {
        name: "timings.navigationTiming.domInteractive.median",
        maxScoreThreshold: 2000,
        minScoreThreshold: 10000,
        weight: 1
    },
];

const filterBrowserTimeData = (report = {}) => {
    const { statistics = {} } = report[0];

    return flatten(statistics);
};

const myGetFile = async (options) => {
    options.fileName = 'browsertime.json';
    const file = await garie_plugin.utils.helpers.getNewestFile(options);
    return filterBrowserTimeData(JSON.parse(file));
}

const myGetData = async (item) => {
    const { url } = item.url_settings;
    return new Promise(async (resolve, reject) => {
        try {
            const cpuUsage = config.plugins['browsertime'].cpuUsage ? config.plugins['browsertime'].cpuUsage : 1
            const { reportDir } = item;
            const options = { script: path.join(__dirname, './browsertime.sh'),
                        url: url,
                        reportDir: reportDir,
                        params: [ cpuUsage ],
                        callback: myGetFile
                    }
            data = await garie_plugin.utils.helpers.executeScript(options);

            var clear_data = {};
            Object.keys(data).forEach(function(data_key){
                clear_data[data_key.replace(/[^\x00-\x7F]/g, "").replace(/\s/g,"")] = data[data_key];
            });

            // Compute and insert cumulative metric score in data for DB
            var weightSum = 0;
            var score = 0;
            scoreMeasurements.forEach(function(sm){
                if (clear_data[sm.name] < sm.maxScoreThreshold) {
                    score = score + 100 * sm.weight;
                } else if (clear_data[sm.name] > sm.minScoreThreshold) {
                    score = score;
                } else {
                    score = score + 100 * sm.weight * (sm.minScoreThreshold - clear_data[sm.name]) / (sm.minScoreThreshold - sm.maxScoreThreshold);
                }
                weightSum = weightSum + sm.weight;
            });
            score = score / weightSum;
            clear_data[scoreKey] = score;

            resolve(clear_data);
        } catch (err) {
            console.log(`Failed to get data for ${url}`, err);
            reject(`Failed to get data for ${url}`);
        }
    });
};



console.log("Start");


const app = express();
app.use('/reports', express.static('reports'), serveIndex('reports', { icons: true }));

const main = async () => {
  return new Promise(async (resolve, reject) => {
    try{
      await garie_plugin.init({
        db_name:'browsertime',
        getData:myGetData,
        report_folder_name:'browsertime-results',
        plugin_name:'browsertime',
        app_root: path.join(__dirname, '..'),
        config:config
      });
      const cpuUsage = config.plugins['browsertime'].cpuUsage ? config.plugins['browsertime'].cpuUsage : 1
      console.log('CPUs usage percentage by each thread: ' + cpuUsage * 100 + '%')
    }
    catch(err){
      reject(err);
    }
  });
}

if (process.env.ENV !== 'test') {
  const server = app.listen(3000, async () => {
    console.log('Application listening on port 3000');
    try{
      await main();
    }
    catch(err){
      console.log(err);
      server.close();
    }
  });
}
