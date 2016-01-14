/**
 * A facade to access JScrambler API using JScramblerClient.
 * @namespace jScramblerFacade
 * @author José Magalhães (magalhas@gmail.com)
 * @license MIT <http://opensource.org/licenses/MIT>
 */
'use strict';

var assign = require('lodash.assign');
var config = require('./lib/config');
var defaults = require('lodash.defaults');
var fs = require('fs-extra');
var glob = require('glob');
var JScramblerClient = require('./jscrambler-client');
var JSZip = require('jszip');
var omit = require('lodash.omit');
var path = require('flavored-path');
var Q = require('q');
var size = require('lodash.size');
var temp = require('temp').track();
var util = require('util');


var debug = !!process.env.DEBUG;

exports = module.exports =
/** @lends jScramblerFacade */
{
  Client: JScramblerClient,
  config: config,
  /**
   * Downloads code through the API.
   * @param {JScramblerClient} client
   * @param {String} projectId
   * @param {String} [sourceId]
   * @returns {Q.promise}
   */
  downloadCode: function (client, projectId, sourceId) {
    var deferred = Q.defer();
    debug && console.log('Downloading code', projectId, sourceId);
    this
      .pollProject(client, projectId)
      .then(function () {
        var path = '/code/' + projectId;
        if (sourceId) {
          if (!/^.*\..*$/.test(sourceId))
            throw new Error('Source extension missing');
          else path += '/' + sourceId;
        } else if (!/^.*\.zip$/.test(projectId))
          path += '.zip';
        client.get(path, null, function (err, res, body) {
          try {
            if (err) deferred.reject(err);
            else if (res.statusCode >= 400) {
              if (Buffer.isBuffer(body)) {
                deferred.reject(JSON.parse(body));
              } else {
                deferred.reject(body);
              }
            } else {
              deferred.resolve(body);
            }
          } catch (ex) {
            deferred.reject(body);
          }
        });
      })
      .fail(function () {
        deferred.reject.apply(null, arguments);
      });
    return deferred.promise;
  },
  /**
   * Gets projects info.
   * @param {JScramblerClient} client
   * @returns {Q.promise}
   */
  getInfo: function (client, projectId) {
    var deferred = Q.defer();
    var path = projectId ? '/code/' + projectId + '.json' : '/code.json';
    debug && console.log('Getting info', projectId);
    client.get(path, null, function (err, res, body) {
      try {
        if (err) deferred.reject(err);
        else if (res.statusCode >= 400) {
          if (Buffer.isBuffer(body)) {
            deferred.reject(JSON.parse(body));
          } else {
            deferred.reject(body);
          }
        } else {
          if (Buffer.isBuffer(body)) {
            deferred.resolve(JSON.parse(body));
          } else {
            deferred.resolve(body);
          }
        }
      } catch (ex) {
        deferred.reject(body);
      }
    });
    return deferred.promise;
  },
  /**
   * Poll project until the build finishes.
   */
  pollProject: function (client, projectId) {
    var deferred = Q.defer();
    var isFinished = function () {
      debug && console.log('Polling project', projectId);
      this
        .getInfo(client, projectId)
        .then(function (res) {
          // Did it finish?
          if (res.finished_at) {
            if (res.error_id && res.error_id !== '0') {
              deferred.reject(res);
            } else {
              deferred.resolve(res);
            }
            return;
          }
          // Try again later...
          setTimeout(isFinished, 1000);
        })
        .fail(function () {
          deferred.reject.apply(null, arguments);
        });
    }.bind(this);
    isFinished();
    return deferred.promise;
  },
  /**
   * Uploads code through the API.
   * @param {JScramblerClient} client
   * @param {Object} params
   * @returns {Q.promise}
   */
  uploadCode: function (client, params) {
    var deferred = Q.defer();

    params = assign({}, params);
    // If there are no params fallback to `cfg`
    var rawParams = omit(params, ['files', 'cwd', 'apiVersion', 'port', 'deleteProject']);
    if (Object.keys(rawParams).length === 0) {
      params = defaults(params, this.config.params);
    }

    params.files = params.files.slice();
    this.zipProject(params.files, params.cwd);
    delete params.cwd;

    debug && console.log('Uploading code', util.inspect(params));
    client.post('/code.json', params, function (err, res, body) {
      try {
        if (err) deferred.reject(err);
        else if (res.statusCode >= 400) {
          if (Buffer.isBuffer(body)) {
            deferred.reject(JSON.parse(body));
          } else {
            deferred.reject(body);
          }
        } else {
          if (Buffer.isBuffer(body)) {
            deferred.resolve(JSON.parse(body));
          } else {
            deferred.resolve(body);
          }
        }
      } catch (ex) {
        deferred.reject(body);
      }
    }.bind(this));
    return deferred.promise;
  },
  /**
   * Deletes code through the API.
   * @param {JScramblerClient} client
   * @param {String} projectId
   * @returns {Q.promise}
   */
  deleteCode: function (client, projectId) {
    var deferred = Q.defer();
    debug && console.log('Deleting project', projectId);
    client.delete('/code/' + projectId + '.zip', null, function (err, res, body) {
      try {
        if (err) deferred.reject(err);
        else if (res.statusCode >= 400) {
          if (Buffer.isBuffer(body)) {
            deferred.reject(JSON.parse(body));
          } else {
            deferred.reject(body);
          }
        }
        else {
          if (Buffer.isBuffer(body)) {
            deferred.resolve(JSON.parse(body));
          } else {
            deferred.resolve(body);
          }
        }
      } catch (ex) {
        deferred.reject(body);
      }
    });
    return deferred.promise;
  },
  /**
   * Common operation sequence intended when using the client. First it
   * uploads a project, then it polls the server to download and unzip the
   * project into a folder.
   * @param {String|Object} configPathOrObject
   * @returns {Q.promise}
   */
  process: function (configPathOrObject, destCallback) {
    var config = typeof configPathOrObject === 'string' ?
          require(configPathOrObject) : configPathOrObject;

    var accessKey = config.keys.accessKey;
    var secretKey = config.keys.secretKey;
    var host = config.host;
    var port = config.port;
    var apiVersion = config.apiVersion;
    // Instance a JScrambler client
    var client = new this.Client({
      accessKey: accessKey,
      secretKey: secretKey,
      host: host,
      port: port,
      apiVersion: apiVersion
    });
    // Check for source files and add them to the parameters
    if (!config.filesSrc) {
      throw new Error('Source files must be provided.');
    }
    // Check if output directory was provided
    if (!config.filesDest && !destCallback) {
      throw new Error('Output directory must be provided.');
    }
    var filesSrc = [];
    for (var i = 0, l = config.filesSrc.length; i < l; ++i) {
      if (typeof config.filesSrc[i] === 'string') {
        filesSrc = filesSrc.concat(glob.sync(config.filesSrc[i], {dot: true}));
      } else {
        filesSrc.push(config.filesSrc[i]);
      }
    }
    // Prepare object to post
    var params = config.params || {};
    params.files = filesSrc;
    var self = this;
    var projectId;
    return this
      .uploadCode(client, params)
      .then(function (res) {
        projectId = res.id;
        return self.downloadCode(client, res.id);
      })
      .then(function (res) {
        return self.unzipProject(res, config.filesDest || destCallback);
      })
      .then(function () {
        if (config.deleteProject) {
          return self.deleteCode(client, projectId);
        }
      });
  },
  /**
   * It zips all files inside the passed parameter into a single zip file. It
   * accepts an optional `cwd` parameter.
   */
  zipProject: function (files, cwd) {
    debug && console.log('Zipping files', util.inspect(files));
    // Flag to detect if any file was added to the zip archive
    var hasFiles = false;
    // Sanitize `cwd`
    if (cwd) {
      cwd = path.normalize(cwd);
    }
    // If it's already a zip file
    if (files.length === 1 && /^.*\.zip$/.test(files[0])) {
      hasFiles = true;
      fs.outputFileSync(temp.openSync({suffix: '.zip'}).path, fs.readFileSync(files[0]));
    } else {
      var zip = new JSZip();
      for (var i = 0, l = files.length; i < l; ++i) {
        // Sanitise path
        if (typeof files[i] === 'string') {
          files[i] = path.normalize(files[i]);
          if (files[i].indexOf('../') === 0) {
            files[i] = path.resolve(files[i]);
          }
        }
        // Bypass unwanted patterns from `files`
        if (/.*\.(git|hg)(\/.*|$)/.test(files[i].path || files[i])) {
          continue;
        }
        var buffer, name;
        var sPath;
        if (cwd && files[i].indexOf && files[i].indexOf(cwd) !== 0) {
          sPath = path.join(cwd, files[i]);
        } else {
          sPath = files[i];
        }
        // If buffer
        if (files[i].contents) {
          name = path.relative(files[i].cwd, files[i].path);
          buffer = files[i].contents;
        }
        // Else if it's a path and not a directory
        else if (!fs.statSync(sPath).isDirectory()) {
          if (cwd && files[i].indexOf && files[i].indexOf(cwd) === 0) {
            name = files[i].substring(cwd.length);
          } else {
            name = files[i];
          }
          buffer = fs.readFileSync(sPath);
        }
        // Else if it's a directory path
        else {
          zip.folder(sPath);
        }
        if (name) {
          hasFiles = true;
          zip.file(name, buffer);
        }
      }
      if (hasFiles) {
        var tempFile = temp.openSync({suffix: '.zip'});
        fs.outputFileSync(tempFile.path, zip.generate({type: 'nodebuffer'}), {encoding: 'base64'});
        files[0] = tempFile.path;
        files.length = 1;
      } else {
        throw new Error('No source files found. If you intend to send a whole directory sufix your path with "**" (e.g. ./my-directory/**)');
      }
    }
  },
  /**
   * It unzips a zip file to the given destination.
   */
  unzipProject: function (zipFile, dest) {
    var zip = new JSZip(zipFile);
    var _size = size(zip.files);
    for (var file in zip.files) {
      if (!zip.files[file].options.dir) {
        var buffer = zip.file(file).asNodeBuffer();
        if (typeof dest === 'function') {
          dest(buffer, file);
        } else if (dest) {
          var lastDestChar = dest[dest.length - 1];
          var destPath;
          if (_size === 1 && lastDestChar !== '/' && lastDestChar !== '\\') {
            destPath = dest;
          } else {
            destPath = path.join(dest, file);
          }
          fs.outputFileSync(destPath, buffer);
        }
      }
    }
  }
};
