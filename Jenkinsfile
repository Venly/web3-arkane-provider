
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
                anyOf {
                    branch 'develop'
                    branch 'hotfix-*'
                    branch 'release-*'
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
              sh "npm run build"
            }
        }
        stage('Publish to npmjs') {
            environment {
                NPM_KEY = credentials('NPM_KEY')
            }
            when {
                anyOf {
                    branch 'develop'
                    branch 'hotfix-*'
                    branch 'release-*'
                    branch 'master'
                }
            }
            steps {
                sh "printf '//registry.npmjs.org/:_authToken=' > .npmrc && printf '${NPM_KEY}' >> .npmrc"
                script {
                    if (env.BRANCH_NAME == 'master') {
                        sh 'npm publish'
                    } else {
                        sh 'npm publish --tag ${BRANCH_NAME}'
                    }
                }
                withCredentials([gitUsernamePassword(credentialsId: 'GITHUB_CRED', gitToolName: 'Default')]) {
                    sh 'git push origin HEAD:refs/heads/${GIT_BRANCH}'
                    sh 'git push origin --tags'
                }
            }
            post {
                always {
                    cleanWs(deleteDirs: true, patterns: [[pattern: '.npmrc', type: 'INCLUDE']])
                }
            }
        }
    }
}
