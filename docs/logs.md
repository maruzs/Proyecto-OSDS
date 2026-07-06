marianoemunozr@cloudshell:~ (os-ds-498615)$ ZONE="us-central1-a"
BRANCH="parte3/general"

echo "⚙️ Desplegando réplicas de aplicación en VM1..."
gcloud compute ssh vm-hospital-local --zone=$ZONE --command="
  cd ~/Proyecto-OSDS
  git fetch origin && git checkout $BRANCH && git pull origin $BRANCH
  cd vms/vm1-hospital
  sudo docker compose down --remove-orphans 2>/dev/null
  sudo docker compose up --build -d
"

echo "⚙️ Desplegando réplicas de aplicación en VM2..."
gcloud compute ssh vm-nube-central --zone=$ZONE --command="
  cd ~/Proyecto-OSDS
  git fetch origin && git checkout $BRANCH && git pull origin $BRANCH
  cd vms/vm2-nube
  sudo docker compose down --remove-orphans 2>/dev/null
  sudo docker compose up --build -d
"

echo "⚙️ Actualizando Nginx y reiniciando VM3..."
gcloud compute ssh vm-gateway --zone=$ZONE --command="
  cd ~/Proyecto-OSDS
" sudo docker compose up --build -d-orphans 2>/dev/nullorigin $BRANCH
⚙️ Desplegando réplicas de aplicación en VM1...
Regional Access Boundary HTTP request failed after retries: response_data={'error': {'code': 404, 'message': 'Account not found for email: fd852deb3e|marlanoemunozr@gmail.com', 'status': 'NOT_FOUND'}}, retryable_error=False
From https://github.com/maruzs/Proyecto-OSDS
   e31b4aa..4a7191c  parte3/general -> origin/parte3/general
Already on 'parte3/general'
Your branch is behind 'origin/parte3/general' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)
From https://github.com/maruzs/Proyecto-OSDS
 * branch            parte3/general -> FETCH_HEAD
Updating e31b4aa..4a7191c
Fast-forward
 pruebasTolerancia.md                    | 125 ++++++++++++++++++++++++++++++++
 vms/vm1-hospital/docker-compose.yml     |  17 +++++
 vms/vm2-nube/docker-compose.yml         |  17 +++++
 vms/vm3-gateway/config/nginx/nginx.conf |  16 +++-
 4 files changed, 173 insertions(+), 2 deletions(-)
 create mode 100644 pruebasTolerancia.md
time="2026-07-05T19:55:53Z" level=warning msg="/home/marianoemunozr/Proyecto-OSDS/vms/vm1-hospital/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
 Image vm1-hospital-app-estaciones Building 
 Image vm1-hospital-app-estaciones-replica Building 
#1 [internal] load local bake definitions
#1 reading from stdin 1.23kB done
#1 DONE 0.0s

#2 [app-estaciones-replica internal] load build definition from Dockerfile
#2 DONE 0.0s

#2 [app-estaciones internal] load build definition from Dockerfile
#2 transferring dockerfile: 157B 0.0s done
#2 DONE 0.1s

#3 [app-estaciones internal] load metadata for docker.io/library/node:18-alpine
#3 DONE 0.5s

#4 [app-estaciones-replica internal] load .dockerignore
#4 transferring context: 67B done
#4 DONE 0.0s

#5 [app-estaciones-replica internal] load build context
#5 transferring context: 191B done
#5 DONE 0.0s

#6 [app-estaciones 1/5] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#6 resolve docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e 0.0s done
#6 DONE 0.1s

#7 [app-estaciones 4/5] RUN npm install
#7 CACHED

#8 [app-estaciones 2/5] WORKDIR /app
#8 CACHED

#9 [app-estaciones 3/5] COPY package*.json ./
#9 CACHED

#10 [app-estaciones 5/5] COPY . .
#10 CACHED

#11 [app-estaciones] exporting to image
#11 exporting layers
#11 exporting layers done
#11 exporting manifest sha256:254c34cb7263474994a5538bafa8feae7c75c8cc53c90a52499bd56f70dbf2c4
#11 exporting manifest sha256:254c34cb7263474994a5538bafa8feae7c75c8cc53c90a52499bd56f70dbf2c4 0.2s done
#11 exporting config sha256:45ecb8d427f8827905ff6111705c46f19fb7fde0793e2e17c2df30f2c53d9ff4
#11 exporting config sha256:45ecb8d427f8827905ff6111705c46f19fb7fde0793e2e17c2df30f2c53d9ff4 done
#11 exporting attestation manifest sha256:29ace11557ca50da4643454e274888b0a678d5d4343332572da9ec9aa34b4b64 0.1s done
#11 exporting manifest list sha256:601ed29cee7b99c2abc50cd7fe4fb091fb30322c7d89729b62db858b7f450ce2
#11 exporting manifest list sha256:601ed29cee7b99c2abc50cd7fe4fb091fb30322c7d89729b62db858b7f450ce2 0.0s done
#11 naming to docker.io/library/vm1-hospital-app-estaciones:latest done
#11 unpacking to docker.io/library/vm1-hospital-app-estaciones:latest 0.0s done
#11 DONE 0.4s

#12 [app-estaciones-replica] exporting to image
#12 exporting layers done
#12 exporting manifest sha256:b529c1fd053210c1c673a58822aec19706f0e8b751f1c6019c675168dadc894d 0.3s done
#12 exporting config sha256:55b5ca1d6e7e5a941c916487f491dd87b4a89670d683e0c04eba9252232b5fe4 0.0s done
#12 exporting attestation manifest sha256:ab1cd53e3d3588fa235e348159796dd63d1c7d8d3cc00881032bdf472cd57863 0.1s done
#12 exporting manifest list sha256:914d083ec3139d2bf7a3eabc03fc22bf78498006199985a763dd40533e569290 0.0s done
#12 naming to docker.io/library/vm1-hospital-app-estaciones-replica:latest 0.1s done
#12 unpacking to docker.io/library/vm1-hospital-app-estaciones-replica:latest
#12 unpacking to docker.io/library/vm1-hospital-app-estaciones-replica:latest 0.0s done
#12 DONE 0.5s

#13 [app-estaciones] resolving provenance for metadata file
#13 DONE 0.0s

#14 [app-estaciones-replica] resolving provenance for metadata file
#14 DONE 0.0s
 Image vm1-hospital-app-estaciones Built 
 Image vm1-hospital-app-estaciones-replica Built 
time="2026-07-05T19:55:59Z" level=warning msg="a network with name hospital_net exists but was not created for project \"vm1-hospital\".\nSet `external: true` to use an existing network"
time="2026-07-05T19:55:59Z" level=warning msg="a network with name dmz_net exists but was not created for project \"vm1-hospital\".\nSet `external: true` to use an existing network"
 Container db-local-master Creating 
 Container db-local-master Created 
 Container db-local-replica Creating 
 Container db-local-replica Created 
 Container db-local-proxy Creating 
 Container db-local-proxy Created 
 Container app-estaciones-replica Creating 
 Container app-estaciones Creating 
 Container app-estaciones Created 
 Container app-estaciones-replica Created 
 Container db-local-master Starting 
 Container db-local-master Started 
 Container db-local-master Waiting 
 Container db-local-master Healthy 
 Container db-local-replica Starting 
 Container db-local-replica Started 
 Container db-local-proxy Starting 
 Container db-local-proxy Started 
 Container app-estaciones-replica Starting 
 Container app-estaciones Starting 
 Container app-estaciones Started 
 Container app-estaciones-replica Started 
⚙️ Desplegando réplicas de aplicación en VM2...
Regional Access Boundary HTTP request failed after retries: response_data={'error': {'code': 404, 'message': 'Account not found for email: fd852deb3e|marlanoemunozr@gmail.com', 'status': 'NOT_FOUND'}}, retryable_error=False
From https://github.com/maruzs/Proyecto-OSDS
   e31b4aa..4a7191c  parte3/general -> origin/parte3/general
Already on 'parte3/general'
Your branch is behind 'origin/parte3/general' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)
From https://github.com/maruzs/Proyecto-OSDS
 * branch            parte3/general -> FETCH_HEAD
Updating e31b4aa..4a7191c
Fast-forward
 pruebasTolerancia.md                    | 125 ++++++++++++++++++++++++++++++++
 vms/vm1-hospital/docker-compose.yml     |  17 +++++
 vms/vm2-nube/docker-compose.yml         |  17 +++++
 vms/vm3-gateway/config/nginx/nginx.conf |  16 +++-
 4 files changed, 173 insertions(+), 2 deletions(-)
 create mode 100644 pruebasTolerancia.md
time="2026-07-05T19:56:32Z" level=warning msg="/home/marianoemunozr/Proyecto-OSDS/vms/vm2-nube/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
 Image vm2-nube-app-terminales Building 
 Image vm2-nube-app-terminales-replica Building 
#1 [internal] load local bake definitions
#1 reading from stdin 1.23kB done
#1 DONE 0.0s

#2 [app-terminales internal] load build definition from Dockerfile
#2 transferring dockerfile: 203B 0.0s done
#2 transferring dockerfile: 203B 0.0s done
#2 DONE 0.1s

#3 [app-terminales-replica internal] load metadata for docker.io/library/python:3.10-slim
#3 DONE 0.5s

#4 [app-terminales-replica internal] load .dockerignore
#4 transferring context: 67B 0.0s done
#4 DONE 0.1s

#5 [app-terminales-replica internal] load build context
#5 transferring context: 128B done
#5 DONE 0.0s

#6 [app-terminales-replica 1/5] FROM docker.io/library/python:3.10-slim@sha256:5f9928ea39771e8ddf4fb9a96ab24f65f087793635614405a1dc9384f040852e
#6 resolve docker.io/library/python:3.10-slim@sha256:5f9928ea39771e8ddf4fb9a96ab24f65f087793635614405a1dc9384f040852e 0.0s done
#6 DONE 0.1s

#7 [app-terminales 3/5] COPY requirements.txt .
#7 CACHED

#8 [app-terminales 2/5] WORKDIR /app
#8 CACHED

#9 [app-terminales 4/5] RUN pip install --no-cache-dir -r requirements.txt
#9 CACHED

#10 [app-terminales 5/5] COPY . .
#10 CACHED

#11 [app-terminales] exporting to image
#11 exporting layers done
#11 exporting manifest sha256:ef9ddd3ec57554938e9ddde32f3f5e136fa548492dcd8616194f3906277653ee 0.0s done
#11 exporting config sha256:edf50b0915dc25c731f4188cb2e9380948416bf8bd674266ff5888314b8777e1
#11 exporting config sha256:edf50b0915dc25c731f4188cb2e9380948416bf8bd674266ff5888314b8777e1 done
#11 exporting attestation manifest sha256:861f2cec0f7829bf9bc570fb3b6d80e84752de59dde66abf08ec6873527f7bda
#11 exporting attestation manifest sha256:861f2cec0f7829bf9bc570fb3b6d80e84752de59dde66abf08ec6873527f7bda 0.1s done
#11 exporting manifest list sha256:d7829920e5fdf64ef1799326fc617a9842d10a58c3cba08c352e916aaad06e8f 0.1s done
#11 naming to docker.io/library/vm2-nube-app-terminales:latest
#11 naming to docker.io/library/vm2-nube-app-terminales:latest 0.0s done
#11 unpacking to docker.io/library/vm2-nube-app-terminales:latest 0.0s done
#11 DONE 0.3s

#12 [app-terminales-replica] exporting to image
#12 exporting layers done
#12 exporting manifest sha256:f1b768f2ad5a4906ffce94562d90a2d577283534a4cb92987653a1d28aa12663 0.0s done
#12 exporting config sha256:1184d9dd5d306e51ff5ac13331cb889c2799408cdc57d96508e79e297a1f96ff 0.0s done
#12 exporting attestation manifest sha256:46d9668b6a7863c7f47a941f8536fcb9428e294650803648020da83125870fc5 0.1s done
#12 exporting manifest list sha256:8fb4e0b2a80d62feb9bf6f3ff175c1a4f137d64f07999fbeba68a32823a0372e 0.1s done
#12 naming to docker.io/library/vm2-nube-app-terminales-replica:latest 0.2s done
#12 unpacking to docker.io/library/vm2-nube-app-terminales-replica:latest
#12 unpacking to docker.io/library/vm2-nube-app-terminales-replica:latest 0.0s done
#12 DONE 0.5s

#13 [app-terminales] resolving provenance for metadata file
#13 DONE 0.0s

#14 [app-terminales-replica] resolving provenance for metadata file
#14 DONE 0.0s
 Image vm2-nube-app-terminales-replica Built 
 Image vm2-nube-app-terminales Built 
time="2026-07-05T19:56:38Z" level=warning msg="a network with name dmz_net exists but was not created for project \"vm2-nube\".\nSet `external: true` to use an existing network"
time="2026-07-05T19:56:38Z" level=warning msg="a network with name cloud_net exists but was not created for project \"vm2-nube\".\nSet `external: true` to use an existing network"
 Container db-nube-master Creating 
 Container db-nube-master Created 
 Container db-nube-replica Creating 
 Container db-nube-replica Created 
 Container db-nube-proxy Creating 
 Container db-nube-proxy Created 
 Container app-terminales-replica Creating 
 Container app-terminales Creating 
 Container app-terminales-replica Created 
 Container app-terminales Created 
 Container db-nube-master Starting 
 Container db-nube-master Started 
 Container db-nube-master Waiting 
 Container db-nube-master Healthy 
 Container db-nube-replica Starting 
 Container db-nube-replica Started 
 Container db-nube-proxy Starting 
 Container db-nube-proxy Started 
 Container app-terminales-replica Starting 
 Container app-terminales Starting 
 Container app-terminales-replica Started 
 Container app-terminales Started 
⚙️ Actualizando Nginx y reiniciando VM3...
Regional Access Boundary HTTP request failed after retries: response_data={'error': {'code': 404, 'message': 'Account not found for email: fd852deb3e|marlanoemunozr@gmail.com', 'status': 'NOT_FOUND'}}, retryable_error=False
From https://github.com/maruzs/Proyecto-OSDS
   e31b4aa..4a7191c  parte3/general -> origin/parte3/general
Already on 'parte3/general'
Your branch is behind 'origin/parte3/general' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)
From https://github.com/maruzs/Proyecto-OSDS
 * branch            parte3/general -> FETCH_HEAD
Updating e31b4aa..4a7191c
Fast-forward
 pruebasTolerancia.md                    | 125 ++++++++++++++++++++++++++++++++
 vms/vm1-hospital/docker-compose.yml     |  17 +++++
 vms/vm2-nube/docker-compose.yml         |  17 +++++
 vms/vm3-gateway/config/nginx/nginx.conf |  16 +++-
 4 files changed, 173 insertions(+), 2 deletions(-)
 create mode 100644 pruebasTolerancia.md
time="2026-07-05T19:56:58Z" level=warning msg="/home/marianoemunozr/Proyecto-OSDS/vms/vm3-gateway/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
 Image vm3-gateway-middleware Building 
 Image vm3-gateway-app-bodega Building 
#1 [internal] load local bake definitions
#1 reading from stdin 1.13kB done
#1 DONE 0.0s

#2 [middleware internal] load build definition from Dockerfile
#2 transferring dockerfile: 283B 0.1s done
#2 DONE 0.1s

#3 [app-bodega internal] load build definition from Dockerfile
#3 transferring dockerfile: 158B 0.1s done
#3 DONE 0.1s

#4 [middleware internal] load metadata for docker.io/library/node:18-alpine
#4 DONE 0.7s

#5 [app-bodega internal] load .dockerignore
#5 transferring context: 2B 0.0s done
#5 DONE 0.1s

#6 [middleware internal] load .dockerignore
#6 transferring context: 2B 0.0s done
#6 DONE 0.1s

#7 [middleware internal] load build context
#7 transferring context: 93B 0.0s done
#7 DONE 0.1s

#8 [app-bodega internal] load build context
#8 transferring context: 89B done
#8 DONE 0.0s

#9 [middleware 1/5] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#9 resolve docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e 0.1s done
#9 DONE 0.2s

#10 [middleware 3/6] WORKDIR /app
#10 CACHED

#11 [middleware 4/6] COPY package*.json ./
#11 CACHED

#12 [middleware 2/6] RUN apk add --no-cache python3 make g++
#12 CACHED

#13 [middleware 5/6] RUN npm install
#13 CACHED

#14 [middleware 6/6] COPY . .
#14 CACHED

#15 [app-bodega 2/5] WORKDIR /app
#15 CACHED

#16 [app-bodega 3/5] COPY package*.json ./
#16 CACHED

#17 [app-bodega 4/5] RUN npm install
#17 CACHED

#18 [app-bodega 5/5] COPY . .
#18 CACHED

#19 [middleware] exporting to image
#19 exporting layers 0.0s done
#19 exporting manifest sha256:b06b046530567e9fa897e58fc0fa7c7b3f2436645234644565b6f83716d46520 done
#19 exporting config sha256:31a53ffd4dccc270b9599d89287ff7e89cf2077c8024a43e2446e6e7e0cc45a9 done
#19 exporting attestation manifest sha256:e137913ea1bfacfb6d9d4a4a10ba6e43b2c363dc2b079bb6f194846268bb5b9f
#19 exporting attestation manifest sha256:e137913ea1bfacfb6d9d4a4a10ba6e43b2c363dc2b079bb6f194846268bb5b9f 0.1s done
#19 exporting manifest list sha256:7897e74faeb1fdad1278bc3a3f0551929a1270018762ef098afb59ee9785ad62
#19 exporting manifest list sha256:7897e74faeb1fdad1278bc3a3f0551929a1270018762ef098afb59ee9785ad62 0.1s done
#19 naming to docker.io/library/vm3-gateway-middleware:latest 0.0s done
#19 unpacking to docker.io/library/vm3-gateway-middleware:latest 0.0s done
#19 DONE 0.5s

#20 [app-bodega] exporting to image
#20 exporting layers 0.0s done
#20 exporting manifest sha256:e01316f8c3e9fdf0e179c99ee207d4f2d6d99e6152968331af37c58ca70bf8e6 done
#20 exporting config sha256:565245dda6747f341e06304c1521727ab2ed84e6e359d4e54f5e18d9c41e3b5d done
#20 exporting attestation manifest sha256:30d2f39f8d50920b6a87ac7694a18c8d2ec00dc0722b56a5ffa15eae702a4135 0.1s done
#20 exporting manifest list sha256:c7efd4a288484a0e8baae6d191b6af71a6ea4e1a05dbbda4ff9dfa7bbf30549b 0.1s done
#20 naming to docker.io/library/vm3-gateway-app-bodega:latest 0.0s done
#20 unpacking to docker.io/library/vm3-gateway-app-bodega:latest 0.1s done
#20 DONE 0.5s

#21 [app-bodega] resolving provenance for metadata file
#21 DONE 0.0s

#22 [middleware] resolving provenance for metadata file
#22 DONE 0.0s
 Image vm3-gateway-middleware Built 
 Image vm3-gateway-app-bodega Built 
time="2026-07-05T19:57:04Z" level=warning msg="a network with name hospital_net exists but was not created for project \"vm3-gateway\".\nSet `external: true` to use an existing network"
time="2026-07-05T19:57:04Z" level=warning msg="a network with name cloud_net exists but was not created for project \"vm3-gateway\".\nSet `external: true` to use an existing network"
time="2026-07-05T19:57:04Z" level=warning msg="a network with name dmz_net exists but was not created for project \"vm3-gateway\".\nSet `external: true` to use an existing network"
 Container cloudflare-tunnel Creating 
 Container db-central-master Creating 
 Container nginx-proxy Creating 
 Container cloudflare-tunnel Created 
 Container db-central-master Created 
 Container db-central-replica Creating 
 Container nginx-proxy Created 
 Container db-central-replica Created 
 Container db-central-proxy Creating 
 Container db-central-proxy Created 
 Container app-bodega Creating 
 Container app-middleware Creating 
 Container app-bodega Created 
 Container app-middleware Created 
 Container db-central-master Starting 
 Container nginx-proxy Starting 
 Container cloudflare-tunnel Starting 
 Container cloudflare-tunnel Started 
 Container db-central-master Started 
 Container db-central-master Waiting 
 Container nginx-proxy Started 
 Container db-central-master Healthy 
 Container db-central-replica Starting 
 Container db-central-replica Started 
 Container db-central-proxy Starting 
 Container db-central-proxy Started 
 Container app-middleware Starting 
 Container app-bodega Starting 
 Container app-bodega Started 
 Container app-middleware Started 