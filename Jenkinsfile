
pipeline {
    agent any
    environment {
        GITHUB_CREDS = credentials('GITHUB_CRED')
        NPM_KEY = credentials('NPM_KEY')
    }
    options {
        disableConcurrentBuilds()
        timeout(time: 15, unit: 'MINUTES')
    }
    stages {
        stage ('Bump version (develop)') {
            when {
                expression {
                    return env.BRANCH_NAME == 'develop'
                }
            }
            steps {
                sh "git config --global user.email \"jenkins@arkane.network\""
                sh "git config --global user.name \"Jenkins\""
                sh "npm version prerelease --preid=develop"
            }
        }
        stage('Build') {
            steps {
              sh "npm i"
              sh "npm run build-ts"
              sh "npm run build-js"
            }
        }
        stage ('Publish (develop)') {
            when {
                expression {
                    GIT_BRANCH = env.BRANCH_NAME
                    return GIT_BRANCH == 'develop'
                }
            }
            steps {
                sh "printf '//registry.npmjs.org/:_authToken=' > .npmrc && printf '${NPM_KEY}' >> .npmrc"
                sh 'npm publish --tag develop'
                withCredentials([usernamePassword(credentialsId: 'GITHUB_CRED', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                    sh 'git push https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/ArkaneNetwork/web3-arkane-provider.git HEAD:refs/heads/${GIT_BRANCH}'
                    sh 'git push https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/ArkaneNetwork/web3-arkane-provider.git --tags'
                }
            }
        }
    }
}
