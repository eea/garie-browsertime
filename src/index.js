const garie_plugin = require('garie-plugin')
const path = require('path');
const fs = require('fs');
const config = require('../config');
const express = require('express');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');
const flatten = require('flat');
const nunjucks = require('nunjucks');

const scoreKey = "browsertimeScore";
const scoreMeasurements = [
    {
        name: "timings.navigationTiming.domInteractive.median",
        maxScoreThreshold: 2000,
        minScoreThreshold: 10000,
        weight: 1
    },
];

const templateApp = express();

const nunjucksEnv = nunjucks.configure(`${__dirname}/templates`, {
    autoescape: true,
    express: templateApp,
    watch: true,
});

const filterBrowserTimeData = (report = {}) => {
    const { statistics = {} } = report[0];

    return flatten(statistics);
};

const writeHTMLFile = async (options) => {
    const fileName = 'browsertime.html';
    const { url } = options;
    const { reportDir} = options;
    const { data } = options;

    const { files = {} } = data[0];
    const { video } = files;

    var videos = new Array();
    video.forEach(v => {
        videos.push(v);
    });

    templateApp.render('results.html', { videos: video }, function(err, html) {
        if (err) {
            console.error(`Could not create results HTML file: ${err}`);
        } else {
            try {
                const folders = fs.readdirSync(reportDir);
                const newestFolder = folders[folders.length - 1];
                fs.writeFileSync(path.join(reportDir, newestFolder, fileName), html);
                console.info('Wrote browsertime.html file to ', path.join(reportDir, newestFolder, fileName));
            } catch (err) {
                console.error(`Failed to write browsertime.html file for ${url}`, err);
            }
        }
    });
};

const myGetFile = async (options) => {
    options.fileName = 'browsertime.json';
    console.log(`myGetFile params: ${options.reportDir} - ${options.fileName}`);
    const file = await garie_plugin.utils.helpers.getNewestFile(options);
    const jsonData = JSON.parse(file);

    options.data = jsonData;
    await writeHTMLFile(options);

    return filterBrowserTimeData(jsonData);
}

const myGetData = async (item) => {
    const { url } = item.url_settings;

    return new Promise(async (resolve, reject) => {
        try {
            const cpuUsage = config.plugins['browsertime'].cpuUsage ? config.plugins['browsertime'].cpuUsage : 1
            const { reportDir } = item;
            const options = {
                script: path.join(__dirname, './browsertime.sh'),
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

            console.info(`Writing score: ${score}`);

            resolve(clear_data);
        } catch (err) {
            console.log(`Failed to get data for ${url}`, err);
            reject(`Failed to get data for ${url}`);
        }
    });
};



console.log("Start");

const main = async () => {
  return new Promise(async (resolve, reject) => {
    try{
      const {app} = await garie_plugin.init({
        db_name: 'browsertime',
        getData: myGetData,
        report_folder_name: 'browsertime-results',
        plugin_name: 'browsertime',
        app_root: path.join(__dirname, '..'),
        config: config,
        onDemand: true,
      });
      const cpuUsage = config.plugins['browsertime'].cpuUsage ? config.plugins['browsertime'].cpuUsage : 1;
      console.log('CPUs usage percentage by each thread: ' + cpuUsage * 100 + '%');
      app.listen(3000, () => {
        console.log('Application listening on port 3000');
      });
    }
    catch(err){
      console.log(err);
    }
  });
}

if (process.env.ENV !== 'test') {
    main();
}
