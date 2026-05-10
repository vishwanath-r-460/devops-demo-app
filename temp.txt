pipeline {

    agent any

    environment {
        DOCKER_IMAGE = "vishwanath460/devops-demo-app"
        VERSION = "v1.${BUILD_NUMBER}"
        CONTAINER_NAME = "devops-demo-app"
    }

    stages {

        stage('Clone') {
            steps {
                git branch: 'main',
                url: 'https://github.com/vishwanath-r-460/devops-demo-app.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                docker build -t $DOCKER_IMAGE:$VERSION .
                docker tag $DOCKER_IMAGE:$VERSION $DOCKER_IMAGE:latest
                '''
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'USER',
                        passwordVariable: 'PASS'
                    )
                ]) {

                    sh '''
                    echo $PASS | docker login -u $USER --password-stdin
                    '''
                }
            }
        }

        stage('Push Image') {
            steps {
                sh '''
                docker push $DOCKER_IMAGE:$VERSION
                docker push $DOCKER_IMAGE:latest
                '''
            }
        }

        stage('Deploy Container') {
            steps {
                sh '''
                echo "Stopping old container..."
                docker stop $CONTAINER_NAME || true

                echo "Removing old container..."
                docker rm $CONTAINER_NAME || true

                echo "Starting new container..."

                docker run -d \
                --restart always \
                -p 3000:3000 \
                --name $CONTAINER_NAME \
                $DOCKER_IMAGE:$VERSION
                '''
            }
        }

        stage('Verify App') {
            steps {
                sh '''
                echo "Checking running container..."
                docker ps | grep $CONTAINER_NAME

                echo "Waiting for application startup..."
                sleep 10

                for i in $(seq 1 10)
                do
                    echo "Verification attempt $i..."

                    if docker logs $CONTAINER_NAME | grep "Server running"; then
                        echo "Application deployed successfully!"
                        exit 0
                    fi

                    sleep 5
                done

                echo "Application failed to start!"
                docker logs $CONTAINER_NAME

                exit 1
                '''
            }
        }

        stage('Save Last Success') {
            steps {
                sh '''
                echo "Saving successful version..."
                echo $VERSION > last_success.txt
                '''
            }
        }
    }

    post {

        success {
            echo 'Pipeline completed successfully!'
        }

        failure {

            sh '''
            echo "Build failed! Starting rollback..."

            if [ -f last_success.txt ]; then

                LAST_SUCCESS=$(cat last_success.txt)

                echo "Rolling back to $LAST_SUCCESS"

                docker stop $CONTAINER_NAME || true
                docker rm $CONTAINER_NAME || true

                docker run -d \
                --restart always \
                -p 3000:3000 \
                --name $CONTAINER_NAME \
                $DOCKER_IMAGE:$LAST_SUCCESS

                echo "Rollback completed successfully!"

            else
                echo "No backup version found!"
            fi
            '''
        }
    }
}