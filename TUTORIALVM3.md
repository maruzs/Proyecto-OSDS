## FUNCIONAMIENTO GENERAL PARA USUARIOS DESDE CLOUD SHELL

```bash
# Encender VMs (Ideal que enciendan solo la que van a usar para no gastar tanto)
gcloud compute instances start vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
# vm-gateway
gcloud compute instances start vm-gateway --zone=us-central1-a
# vm-hospital-local
gcloud compute instances start vm-hospital-local --zone=us-central1-a
# vm-nube-central
gcloud compute instances start vm-nube-central --zone=us-central1-a

# Ingresar mediante ssh (selecciona la que necesites administrar)
gcloud compute ssh vm-hospital-local --zone=us-central1-a
gcloud compute ssh vm-nube-central --zone=us-central1-a
gcloud compute ssh vm-gateway --zone=us-central1-a

# Apagar VMs (fuera del SSH)
gcloud compute instances stop vm-hospital-local vm-nube-central vm-gateway --zone=us-central1-a
```

## Funcionamiento VM3

```bash
# Deben iniciar la VM3 -> vm-gateway
# Una vez dentro deben hacer cd VM3 lo que llevara al codigo de la VM3
# Ahi hacen `sudo docker-compose up -d` para iniciar los servicios (no es necesario --build)
# Para poder ver y probar hay que ir al siguiente link osdsp3.epistia.cl ya que estoy usando un tunel de cloudflare con mi dominio para poder asegurar el HTTPS
```
