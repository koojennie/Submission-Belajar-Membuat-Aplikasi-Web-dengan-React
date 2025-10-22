pipeline {
    agent any

    environment {
        // Ortelius credentials & URLs
        DHURL = "http://18.207.165.74/" // IP EC2 Ortelius
        DHUSER = "admin"
        DHPASS = "admin"

        // Komponen & docker info (kalau tidak pakai docker, bisa dikosongkan)
        DOCKERREPO = "none"
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', credentialsId: 'github-creds', url: 'https://github.com/koojennie/Submission-Belajar-Membuat-Aplikasi-Web-dengan-React.git'
            }
        }

        stage('Set Git Vars') {
            steps {
                script {
                    env.GIT_COMMIT = sh(script: "git rev-parse HEAD", returnStdout: true).trim()
                    env.SHORT_SHA = env.GIT_COMMIT.take(7)
                    env.GIT_BRANCH = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
                    env.GIT_URL = "https://github.com/koojennie/Submission-Belajar-Membuat-Aplikasi-Web-dengan-React"
                    env.GIT_REPO = "Submission-Belajar-Membuat-Aplikasi-Web-Dengan-React"
                }
            }
        }

        stage('Run OpenSSF Scorecard') {
            steps {
                echo "Running OpenSSF Scorecard..."
                sh '''
                curl -L https://github.com/ossf/scorecard/releases/download/v5.3.0/scorecard_5.3.0_linux_amd64.tar.gz -o scorecard.tar.gz
                tar -xzf scorecard.tar.gz
                chmod +x scorecard
                GITHUB_AUTH_TOKEN=${GITHUB_TOKEN} ./scorecard \
                    --repo=${GIT_URL} \
                    --format json \
                    --show-details \
                    > scorecard.json
                echo "✅ OpenSSF Scorecard completed and saved to scorecard.json"
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
                echo "Generating CycloneDX SBOM (fixed Syft version 1.33.0)..."
                sh '''
                curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b $PWD v1.33.0
                ./syft scan dir:. -o cyclonedx-json@1.4 > cyclonedx.json
                echo "✅ SBOM generated successfully with Syft v1.33.0 (CycloneDX 1.4)"
                '''
            }
        }

        stage('Prepare Ortelius Component File') {
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
                    DockerRepo = "${env.DOCKERREPO}"
                    DockerTag = "${env.IMAGE_TAG}"
                    ServiceOwner = "${env.DHUSER}"
                    ServiceOwnerEmail = "togetherforever1404@gmail.com"
                """
            }
        }

        stage('Install Ortelius CLI') {
            steps {
                echo "Installing Ortelius CLI..."
                sh '''
                curl -L https://github.com/Ortelius/ortelius-cli/releases/latest/download/ortelius-linux-amd64.tar.gz -o dh.tar.gz
                tar -xvf dh.tar.gz
                chmod +x ortelius
                mv ortelius dh
                '''
            }
        }

        stage('Publish to Ortelius') {
            steps {
                echo "Publishing component and SBOM to Ortelius..."
                sh '''
                export DHURL=${DHURL}
                export DHUSER=${DHUSER}
                export DHPASS=${DHPASS}
                ./dh updatecomp --rsp component.toml --deppkg "cyclonedx@cyclonedx.json" --deppkg "openssf@scorecard.json"
                '''
            }
        }

        stage('Deploy to Environment in Ortelius') {
            steps {
                echo "Deploying component to Ortelius Environment..."
                sh '''
                export DHURL=${DHURL}
                export DHUSER=${DHUSER}
                export DHPASS=${DHPASS}

                ./dh deploy \
                --appname GLOBAL.CICD.NotesApp \
                --appversion 1.0.0 \
                --deployenv GLOBAL.CICD.Dev \
                --logdeployment \
                --desc "Automated deployment from Jenkins build ${BUILD_NUMBER}"

                echo "✅ Deployment record sent to Ortelius"
                '''
            }
        }
    }
}
