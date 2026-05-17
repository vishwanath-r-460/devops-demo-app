pipeline {

    agent any

    environment {
        DOCKER_IMAGE = "vishwanath460/devops-demo-app"
        VERSION = "v${BUILD_NUMBER}"
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

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                echo "Deploying application to Kubernetes..."

                kubectl apply -f k8s/deployment.yaml
                kubectl apply -f k8s/service.yaml

                echo "Updating deployment image..."

                kubectl set image deployment/devops-demo-app \
                devops-demo-app=$DOCKER_IMAGE:$VERSION

                echo "Waiting for rollout..."

                kubectl rollout status deployment/devops-demo-app
                '''
            }
        }

        stage('Verify Kubernetes Deployment') {
            steps {
                sh '''
                echo "Checking Kubernetes resources..."

                kubectl get pods
                kubectl get deployment
                kubectl get svc

                echo "Deployment verified successfully!"
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
            echo "Build failed! Starting Kubernetes rollback..."

            kubectl rollout undo deployment/devops-demo-app || true

            echo "Rollback completed!"
            '''
        }
    }
}