#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { ConfigParser } = require('cordova-common');
const plist = require('plist');

module.exports = function (context) {
    console.log('Hook script update_ios_plist.js is executing.');

    const configXmlPath = path.resolve(context.opts.projectRoot, 'config.xml');
    const appConfig = new ConfigParser(configXmlPath);
    const projectName = appConfig.name();
    console.log('Project Name:', projectName);

    try {
        const iosPlatformDir = path.join(context.opts.projectRoot, 'platforms/ios', projectName);

        if (!fs.existsSync(iosPlatformDir)) {
            throw new Error('iOS platform directory not found.');
        }

        const appPlistPath = path.join(iosPlatformDir, projectName + '-Info.plist');

        if (!fs.existsSync(appPlistPath)) {
            throw new Error('Info.plist not found.');
        }

        let urlSchemes = context.opts.cli_variables.CORDOVA_IOS_URL_SCHEMES;
        if (!urlSchemes) {
            console.log('CORDOVA_IOS_URL_SCHEMES variable not provided.');
            return; // Exit early if urlSchemes is empty
        }

        let plistData = fs.readFileSync(appPlistPath, 'utf8');
        let plistObject = plist.parse(plistData);

        // Add LSApplicationQueriesSchemes key
        if (!plistObject.hasOwnProperty('LSApplicationQueriesSchemes')) {
            plistObject['LSApplicationQueriesSchemes'] = [];
        }

        // Add new URL schemes
        let newSchemes = urlSchemes.split(',').map(scheme => scheme.trim());
        newSchemes.forEach(scheme => {
            if (!plistObject['LSApplicationQueriesSchemes'].includes(scheme)) {
                plistObject['LSApplicationQueriesSchemes'].push(scheme);
            }
        });

        fs.writeFileSync(appPlistPath, plist.build(plistObject), 'utf8');

        console.log('Info.plist updated successfully.');
    } catch (error) {
        console.error('An error occurred:', error.message);
        process.exitCode = 1;
    }
};
