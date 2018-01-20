import {ansiblePhases, ansibleVarFilePaths} from "../../components/HostedEngineSetup/constants"

class AnsibleVarFilesGenerator {
    constructor(heSetupModel) {
        this.model = heSetupModel;

        this.getAnswerFileStrings = this.getAnswerFileStrings.bind(this);
        this.checkValue = this.checkValue.bind(this);
        this.addLineToVarStrings = this.addLineToVarStrings.bind(this);
        this.writeVarFiles = this.writeVarFiles.bind(this);
        this.writeVarFile = this.writeVarFile.bind(this);
        this.writeVarFileForPhase = this.writeVarFileForPhase.bind(this);
        this.formatValue = this.formatValue.bind(this);
        this.generateRandomString = this.generateRandomString.bind(this);
    }

    getAnswerFileStrings() {
        const varStrings = ["", "", ""];
        const separator = ": ";
        const sectionNames = Object.getOwnPropertyNames(this.model);

        let self = this;
        sectionNames.forEach(
            function(sectionName) {
                let section = this.model[sectionName];
                let propNames = Object.getOwnPropertyNames(section);

                propNames.forEach(
                    function(propName) {
                        const prop = section[propName];

                        if (prop.hasOwnProperty("ansibleVarName")) {
                            const val = self.checkValue(propName, prop.value);
                            const varLine = prop.ansibleVarName + separator + self.formatValue(val) + '\n';
                            self.addLineToVarStrings(varLine, varStrings, prop.ansiblePhasesUsed);
                        }
                    }, this)
            }, this);

        return varStrings;
    }

    checkValue(propName, value) {
        let retVal = value;
        if (propName === "storageDomainConnection" || propName === "storage") {
            switch (this.model.storage.domainType.value.toLowerCase()) {
                case "iscsi":
                    retVal = this.model.storage.LunID.value;
                    break;
                case "fc":
                    retVal = "";
                    break;
                default:
                    break;
            }
        }

        if (propName === "domainType" && value.includes("nfs")) {
            retVal = "nfs";
        }

        if (propName === "nfsVersion" && !this.model.storage.domainType.value.includes("nfs")) {
            retVal = "";
        }

        return retVal;
    }

    formatValue(value) {
        let cleanedValue = value;

        if (value === "") {
            cleanedValue = "null";
        }

        if (value === "yes" || value === "no") {
            cleanedValue = "\"" + value + "\"";
        }

        return cleanedValue;
    }

    addLineToVarStrings(varLine, varStrings, phasesUsed) {
        phasesUsed.forEach(
            function(phase) {
                varStrings[phase - 1] += varLine;
            }
        )
    }

    writeVarFiles() {
        const varStrings = this.getAnswerFileStrings();

        const filePaths = [
            ansibleVarFilePaths.BOOTSTRAP_VM,
            ansibleVarFilePaths.CREATE_STORAGE,
            ansibleVarFilePaths.TARGET_VM
        ];

        let promises = [];

        for (let phase = 1; phase <= 3; phase++) {
            const filePath = filePaths[phase - 1];
            const file = cockpit.file(filePath);
            const varString = varStrings[phase - 1];

            promises.push(file.replace(varString)
                .done(function() {
                    console.log("Phase " + phase + " variable file successfully written to " + filePath);
                })
                .fail(function(error) {
                    console.log("Problem writing variable file. " + error);
                })
                .always(function() {
                    file.close()
                })
            );
        }

        return Promise.all(promises);
    }

    generateRandomString() {
        let str = "";
        const strLength = 6;
        const possChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for(let i = 0; i < strLength; i++) {
            str += possChars.charAt(Math.floor(Math.random() * possChars.length));
        }

        return str;
    }

    writeVarFileForPhase(phase) {
        const phases = [
            ansiblePhases.BOOTSTRAP_VM,
            ansiblePhases.CREATE_STORAGE,
            ansiblePhases.TARGET_VM
        ];
        const varStrings = this.getAnswerFileStrings();
        const varString = varStrings[phases.indexOf(phase)];
        return this.writeVarFile(varString, phase);
    }

    writeVarFile(varString, phase) {
        const filePath = "/tmp/ansibleVarFile" + this.generateRandomString() + ".var";
        const file = cockpit.file(filePath);

        return new Promise((resolve, reject) => {
            file.replace(varString)
                .done(function () {
                    console.log("Phase " + phase + " variable file successfully created.");
                    resolve(filePath);
                })
                .fail(function (error) {
                    console.log("Problem creating variable file. Error: " + error);
                    reject(error);
                })
                .always(function () {
                    file.close()
                });
        });
    }
}

export default AnsibleVarFilesGenerator;