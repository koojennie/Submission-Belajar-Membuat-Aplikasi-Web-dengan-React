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

        stage('Ensure Ortelius Environment Exists') {
            steps {
                echo "Ensuring Ortelius environment exists..."
                sh '''
                set -e
                export DHURL=${DHURL}
                export DHUSER=${DHUSER}
                export DHPASS=${DHPASS}

                # 1) Kalau sudah ada, selesai
                if ./dh getenv --name GLOBAL.CICD.Dev >/dev/null 2>&1; then
                echo "Environment already exists: GLOBAL.CICD.Dev"
                exit 0
                fi

                echo "Environment not found, trying to create GLOBAL.CICD.Dev..."

                # 2) Deteksi perintah pembuatan environment berdasarkan versi CLI
                if ./dh --help 2>&1 | grep -q "environment.create"; then
                echo "Using: environment.create"
                ./dh environment.create --envname Dev --domain GLOBAL.CICD --owner admin

                elif ./dh --help 2>&1 | grep -q "^\\s*addenv\\b"; then
                echo "Using: addenv"
                ./dh addenv --envname Dev --domain GLOBAL.CICD --owner admin

                elif ./dh --help 2>&1 | grep -q "\\bcreateenv\\b"; then
                echo "Using: createenv"
                ./dh createenv --envname Dev --domain GLOBAL.CICD --owner admin

                elif ./dh --help 2>&1 | grep -q "\\bupdateenv\\b"; then
                echo "Using: updateenv (create-if-missing)"
                ./dh updateenv --envname Dev --domain GLOBAL.CICD --owner admin

                elif ./dh --help 2>&1 | grep -q "\\badd\\b"; then
                echo "Using: add --type environment"
                ./dh add --type environment --name Dev --domain GLOBAL.CICD --owner admin

                else
                echo "❌ No known env-create command found in this CLI build."
                echo "Available commands:"
                ./dh --help || true
                exit 1
                fi

                # 3) Verifikasi lagi
                if ./dh getenv --name GLOBAL.CICD.Dev >/dev/null 2>&1; then
                echo "✅ Environment created: GLOBAL.CICD.Dev"
                else
                echo "❌ Failed to verify environment creation."
                exit 1
                fi
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
                    --logdeployment

                echo "✅ Deployment record sent to Ortelius"
                '''
            }
        }
    }
}
