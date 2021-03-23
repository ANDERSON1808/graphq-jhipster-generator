'use strict';
var util = require('util');
var yeomanGenerator = require('yeoman-generator');
var chalk = require('chalk');
var packagejs = require(__dirname + '/../../package.json');
var shelljs = require('shelljs');
var fse = require('fs-extra');
var semver = require('semver');

try {
    var BaseGenerator = require('generator-jhipster/generators/generator-base');
    var jhipsterConstants = require('generator-jhipster/generators/generator-constants');
} catch (err) {
    BaseGenerator = require('generator-jhipster/script-base');
    jhipsterConstants = {
        SERVER_MAIN_SRC_DIR: 'src/main/java/',
        SERVER_MAIN_RES_DIR: 'src/main/resources/',
        CLIENT_MAIN_SRC_DIR: 'src/main/webapp/'
    };
}

// Stores JHipster variables
var jhipsterVar = {moduleName: 'graphql-jhipster-generator'};
jhipsterVar.jhipsterConfigDirectory = '.jhipster';

var JhipsterGenerator;

var functions = {
    initializing: {
        displayLogo: function () {
            this.log(`${chalk.blue('      _ _____ _____   _____ _______ ______ _______ ______    _______  ______  ______  _______   _______  ____ ')}`);
            this.log(`${chalk.blue('     | | |  | |_   _|  __ \\ / ____|__  __|  ____|  __ \\  //  ___| ||__ \\ |   _   || |  | |  |     \\ |  |   ')}`);
            this.log(`${chalk.blue('     | | |__| | | | | |__) | (___    | |  | |__  | |__) |  | |  |__ | |__) ||  |_|  || |__| |  |  _   \\|  |   ')}`);
            this.log(`${chalk.blue(' _   | |  __  | | | |  ___/ \\___\\  | |  |  __| |  _  /   | | _  |||  _  / |   __  ||  __  |  |  \ \ |||  |   ')}`);
            this.log(`${chalk.blue('| |__| | |  | |_| |_| |     ____) |  | |  | |____| | \\ \\ | |__| ||| \\ \\ |  |  | || |  | |  | __\ \//|  |___ ')}`);
            this.log(`${chalk.blue(' \\____/|_| |_|_____|_|    |_____/   |_|  |______|_|  \\_\\|______|||  \\_\\|__|  |_||_|  |_|  |____\_\ |______|')}`);
            this.log(chalk.white(`Running ${chalk.bold.blue('graphql-jhipster-generator')} Generator! ${chalk.yellow(`v${packagejs.version}\n`)}`));
        }
    },

    writing: {
        setUpVars: function () {
            var config = getConfig(this);
            var npmConfig = getNpmConfig();
            var bowerConfig = getBowerConfig();

            this.applicationType = config.applicationType;
            this.nativeLanguage = config.nativeLanguage;
            this.languages = config.languages;
            this.enableTranslation = config.enableTranslation;
            this.baseName = config.baseName;
            this.packageName = config.packageName;
            this.packageFolder = config.packageFolder;
            this.skipClient = config.skipClient;
            this.skipServer = config.skipServer;
            this.skipUserManagement = config.skipUserManagement;
            this.authenticationType = config.authenticationType;
            this.jhiPrefixDashed = config.jhiPrefix; // TODO_make sure prefix is ok

            if (this.authenticationType === 'uaa' && this.applicationType === 'gateway') {
                this.skipUserManagement = true;
            }

            this.jhipsterVersion = config.jhipsterVersion;

            // set the major version to 2 if it isn't specified
            if (!this.jhipsterVersion) {
                this.jhipsterMajorVersion = 2;
            } else {
                this.jhipsterMajorVersion = config.jhipsterVersion[0];
            }

            this.requiresSetLocation = this.jhipsterVersion ? semver.lt(this.jhipsterVersion, '4.4.4') : false;
            this.usePostMapping = this.jhipsterVersion ? semver.gte(this.jhipsterVersion, '3.10.0') : false;

            this.entityFiles = shelljs.ls(jhipsterVar.jhipsterConfigDirectory).filter(function (file) {
                return file.match(/\.json$/);
            });

            jhipsterVar.javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
            jhipsterVar.resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
            jhipsterVar.webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

            function getConfig(context) {
                if (context.getJhipsterAppConfig) {
                    return context.getJhipsterAppConfig();
                }
                if (context.getAllJhipsterConfig) {
                    return context.getAllJhipsterConfig();
                }

                var fromPath = '.yo-rc.json';

                if (shelljs.test('-f', fromPath)) {
                    var fileData = fse.readJsonSync(fromPath);
                    if (fileData && fileData['generator-jhipster']) {
                        return fileData['generator-jhipster'];
                    }
                }
                return false;
            }

            function getNpmConfig() {
                var fromPath = 'package.json';

                if (shelljs.test('-f', fromPath)) {
                    var fileData = fse.readJsonSync(fromPath);
                    if (fileData) {
                        return fileData;
                    }
                }
                return false;
            }

            function getBowerConfig() {
                var fromPath = 'bower.json';

                if (shelljs.test('-f', fromPath)) {
                    var fileData = fse.readJsonSync(fromPath);
                    if (fileData) {
                        return fileData;
                    }
                }
                return false;
            }
        },
        validateVars: function () {
            if (!this.jhipsterVersion) {
                this.log(chalk.yellow('WARNING jhipsterVersion is missing in JHipster configuration, defaulting to v2'));
            }
            if (!this.applicationType) {
                this.log(chalk.yellow('WARNING applicationType is missing in JHipster configuration, using monolith as fallback'));
                this.applicationType = 'monolith';
            }
            if (!this.entityFiles || !this.entityFiles.length) {
                this.log(chalk.yellow('WARNING no entities found'));
            }
            if (!this.nativeLanguage) {
                this.log(chalk.yellow('WARNING nativeLanguage is missing in JHipster configuration, using english as fallback'));
                this.nativeLanguage = 'en';
            }
            if (this.enableTranslation && !this.languages) {
                this.log(chalk.yellow('WARNING enableTranslations is true but languages is missing in JHipster configuration, ' +
                    'using \'en, fr\' as fallback'));
                this.languages = ['en', 'fr'];
            }
            if (!this.skipUserManagement) {
                this.skipUserManagement = false;
            }
        },
        writeTemplates: function () {
            if (!this.skipServer) {
                this.template('src/main/java/package/web/graphql/GraphQLErrorHandler.java.ejs', jhipsterVar.javaDir + 'web/graphql/GraphQLErrorHandler.java', this, {});
                this.template('src/main/java/package/web/graphql/account/AccountMutation.java.ejs', jhipsterVar.javaDir + 'web/graphql/account/AccountMutation.java', this, {});
                this.template('src/main/java/package/web/graphql/account/AccountQuery.java.ejs', jhipsterVar.javaDir + 'web/graphql/account/AccountQuery.java', this, {});
                this.template('src/main/java/package/web/graphql/account/response/Token.java.ejs', jhipsterVar.javaDir + 'web/graphql/account/response/Token.java', this, {});
                this.template('src/main/java/package/web/graphql/user/UserQuery.java.ejs', jhipsterVar.javaDir + 'web/graphql/account/user/UserQuery.java', this, {});
                this.template('src/main/java/package/web/graphql/mutation/UserMutation.java.ejs', jhipsterVar.javaDir + 'web/graphql/mutation/UserMutation.java', this, {});
                this.template('src/main/java/package/web/graphql/input/Order.java.ejs', jhipsterVar.javaDir + 'web/graphql/input/Order.java', this, {});
                this.template('src/main/java/package/web/graphql/input/PageInput.java.ejs', jhipsterVar.javaDir + 'web/graphql/input/PageInput.java', this, {});
                this.template('src/main/java/package/web/graphql/exception/AccountResourceException.java.ejs', jhipsterVar.javaDir + 'web/graphql/exception/AccountResourceException.java', this, {});
                this.template('src/main/java/package/web/graphql/exception/ErrorException.java.ejs', jhipsterVar.javaDir + 'web/graphql/exception/ErrorException.java', this, {});
                // Partition code graphql
                this.template('src/main/resources/graphql/account.graphqls.ejs', jhipsterVar.resourceDir + 'graphql/account.graphqls', this, {});
                this.template('src/main/resources/graphql/schema.graphqls.ejs', jhipsterVar.resourceDir + 'graphql/schema.graphqls', this, {});
                this.template('src/main/resources/graphql/user.graphqls.ejs', jhipsterVar.resourceDir + 'graphql/user.graphqls', this, {});
                this.template('src/main/resources/graphql/authority.graphqls.ejs', jhipsterVar.resourceDir + 'graphql/authority.graphqls', this, {});
                this.template('src/main/resources/graphql/filter.graphqls.ejs', jhipsterVar.resourceDir + 'graphql/filter.graphqls', this, {});

                if (this.jhipsterMajorVersion > 4) {
                    this.addMavenDependency('com.graphql-java-kickstart', 'graphql-spring-boot-starter', '8.0.0', '');
                    this.addMavenDependency('com.graphql-java-kickstart', 'playground-spring-boot-starter', '8.0.0', '');
                    this.addMavenDependency('com.graphql-java-kickstart', 'graphiql-spring-boot-starter', '8.0.0', '');
                }
            }
        },

        registering: function () {
            try {
                this.registerModule('generator-jhipster-graphql', 'entity', 'post', 'app', 'Graphql code generator from the jhipster engine');
            } catch (err) {
                this.log(chalk.red.bold('WARN!') + ' Could not register as a jhipster entity post creation hook...\n');
            }
        }
    },

    end: function () {
        this.log('End of graphql-jhipster-generator generator');
    }
};

var generator;

if (yeomanGenerator.extend || yeomanGenerator.Base && yeomanGenerator.Base.extend) {
    if (yeomanGenerator.extend) {
        JhipsterGenerator = yeomanGenerator.extend({});
    } else {
        JhipsterGenerator = yeomanGenerator.Base.extend({});
    }

    util.inherits(JhipsterGenerator, BaseGenerator);

    generator = JhipsterGenerator.extend(functions);
} else {
    generator = class extends BaseGenerator {
        get initializing() {
            return {
                displayLogo() {
                    return functions.initializing.displayLogo.bind(this)();
                }
            };
        }

        get writing() {
            return {
                setUpVars() {
                    return functions.writing.setUpVars.bind(this)();
                },
                validateVars() {
                    return functions.writing.validateVars.bind(this)();
                },
                writeTemplates() {
                    return functions.writing.writeTemplates.bind(this)();
                },
                registering() {
                    return functions.writing.registering.bind(this)();
                },
            };
        }

        end() {
            return functions.end.bind(this)();
        }
    };
}


module.exports = generator;
