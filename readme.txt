sudo docker buildx build --platform linux/amd64 -t koosoftware/anything-llm:ragmyai-v1.15.0 -f ./docker/Dockerfile --push .
sudo docker push koosoftware/anything-llm:ragmyai-v1.15.0

sudo docker pull koosoftware/anything-llm:ragmyai-v1.15.0