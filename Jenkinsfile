pipeline {
    agent any

    environment {
        DHURL  = "http://54.196.55.208/"
        DHUSER = "admin"
        DHPASS = "admin"

        DOCKERREPO = "none"
        IMAGE_TAG  = "1.0.${BUILD_NUMBER}"

        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', credentialsId: 'github-creds',
                    url: 'https://github.com/koojennie/Submission-Belajar-Membuat-Aplikasi-Web-dengan-React.git'
            }
        }

        stage('Set Git Vars') {
            steps {
                script {
                    env.GIT_COMMIT = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    env.SHORT_SHA  = env.GIT_COMMIT.take(7)
                    env.GIT_BRANCH = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
                    env.GIT_URL    = "https://github.com/koojennie/Submission-Belajar-Membuat-Aplikasi-Web-dengan-React"
                }
            }
        }

        stage('Run OpenSSF Scorecard') {
            steps {
                sh '''
                curl -L https://github.com/ossf/scorecard/releases/download/v5.3.0/scorecard_5.3.0_linux_amd64.tar.gz -o scorecard.tar.gz
                tar -xzf scorecard.tar.gz && chmod +x scorecard
                GITHUB_AUTH_TOKEN=${GITHUB_TOKEN} ./scorecard \
                    --repo=${GIT_URL} --format json --show-details > scorecard.json
                test -s scorecard.json || { echo "❌ scorecard.json empty!"; exit 1; }
                echo "✅ OpenSSF Scorecard completed successfully."
                '''
            }
        }

        stage('Build React App') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('Generate SBOM') {
            steps {
                sh '''
                curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b $PWD v1.33.0
                ./syft dir:. -o cyclonedx-json=cyclonedx.json
                test -s cyclonedx.json || { echo "❌ cyclonedx.json empty!"; exit 1; }
                echo "✅ SBOM generated successfully."
                '''
            }
        }

        stage('Prepare component.toml') {
            steps {
                writeFile file: 'component.toml', text: """
Application = "GLOBAL.CICD.NotesApp"
Application_Version = "1.0.0"

Name = "GLOBAL.CICD.NotesWebApp"
Variant = "${env.GIT_BRANCH}"
Version = "v1.0.0.${env.BUILD_NUMBER}-g${env.SHORT_SHA}"

[Attributes]
  GitRepo = "${env.GIT_URL}"
  GitCommit = "${env.GIT_COMMIT}"
  ServiceOwner = "${env.DHUSER}"
  ServiceOwnerEmail = "togetherforever1404@gmail.com"
"""
            }
        }

        stage('Install Ortelius CLI (v9.3.283)') {
            steps {
                sh '''
                echo "Installing Ortelius CLI v9.3.283..."
                curl -L https://github.com/ortelius/ortelius-cli/releases/download/v9.3.283/ortelius-linux-amd64.tar.gz -o dh.tar.gz
                tar -xvf dh.tar.gz
                chmod +x ortelius
                mv ortelius dh
                echo "✅ Ortelius CLI installed successfully."
                '''
            }
        }

        stage('Publish to Ortelius') {
            steps {
                sh '''
                export DHURL=${DHURL}
                export DHUSER=${DHUSER}
                export DHPASS=${DHPASS}

                echo "🚀 Publishing SBOM and Scorecard to Ortelius..."
                ./dh updatecomp \
                  --rsp component.toml \
                  --deppkg "cyclonedx@./cyclonedx.json" \
                  --deppkg "scorecard@./scorecard.json"

                echo "✅ Successfully published to Ortelius!"
                '''
            }
        }
    }
}