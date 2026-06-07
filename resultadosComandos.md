## Cloud Shell

```bash
# 1. Listar todas las instancias de computación en el proyecto (para ver zonas e IPs)
marianoemunozr@cloudshell:~ (os-ds-498615)$ gcloud compute instances list
NAME: vm-gateway
ZONE: us-central1-a
MACHINE_TYPE: e2-medium
PREEMPTIBLE:
INTERNAL_IP: 10.128.0.30
EXTERNAL_IP: 104.154.143.133
STATUS: RUNNING

NAME: vm-hospital-local
ZONE: us-central1-a
MACHINE_TYPE: e2-medium
PREEMPTIBLE:
INTERNAL_IP: 10.128.0.10
EXTERNAL_IP: 34.27.238.97
STATUS: RUNNING

NAME: vm-nube-central
ZONE: us-central1-a
MACHINE_TYPE: e2-medium
PREEMPTIBLE:
INTERNAL_IP: 10.128.0.20
EXTERNAL_IP: 136.116.185.33
STATUS: RUNNING
# 2. Describir detalladamente la VM "vm-gateway" (suponiendo que está en la zona 'us-central1-a', ajústala si es necesario)
marianoemunozr@cloudshell:~ (os-ds-498615)$ gcloud compute instances describe vm-gateway --zone=us-central1-a
canIpForward: false
cpuPlatform: Intel Broadwell
creationTimestamp: '2026-06-06T13:51:15.395-07:00'
deletionProtection: false
disks:
- architecture: X86_64
  autoDelete: true
  boot: true
  deviceName: persistent-disk-0
  diskSizeGb: '10'
  guestOsFeatures:
  - type: VIRTIO_SCSI_MULTIQUEUE
  - type: SEV_CAPABLE
  - type: SEV_SNP_CAPABLE
  - type: SEV_LIVE_MIGRATABLE
  - type: SEV_LIVE_MIGRATABLE_V2
  - type: IDPF
  - type: TDX_CAPABLE
  - type: UEFI_COMPATIBLE
  - type: GVNIC
  index: 0
  interface: SCSI
  kind: compute#attachedDisk
  licenses:
  - https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/licenses/ubuntu-2204-lts
  mode: READ_WRITE
  shieldedInstanceInitialState:
    dbxs:
    - content: 2gcDBhMRFQAAAAAAAAAAABENAAAAAvEOndKvSt9o7kmKqTR9N1ZlpzCCDPUCAQExDzANBglghkgBZQMEAgEFADALBgkqhkiG9w0BBwGgggsIMIIFGDCCBACgAwIBAgITMwAAABNryScg3e1ZiAAAAAAAEzANBgkqhkiG9w0BAQsFADCBgDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEqMCgGA1UEAxMhTWljcm9zb2Z0IENvcnBvcmF0aW9uIEtFSyBDQSAyMDExMB4XDTE2MDEwNjE4MzQxNVoXDTE3MDQwNjE4MzQxNVowgZUxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xDTALBgNVBAsTBE1PUFIxMDAuBgNVBAMTJ01pY3Jvc29mdCBXaW5kb3dzIFVFRkkgS2V5IEV4Y2hhbmdlIEtleTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKXiCkZgbboTnVZnS1h_JbnlcVst9wtFK8NQjTpeB9wirml3h-fzi8vzki0hSNBD2Dg49lGEvs4egyowmTsLu1TnBUH1f_Hi8Noa7fKXV6F93qYrTPajx5v9L7NedplWnMEPsRvJrQdrysTZwtoXMLYDhc8bQHI5nlJDfgqrB8JiC4A3vL9i19lkQOTq4PZb5AcVcE0wlG7lR_btoQN0g5B4_7pI2S_9mU1PXr1NBSEl48Kl4cJwO2GyvOVvxQ6wUSFTExmCBKrT3LnPU5lZY68n3MpZ5VY4skhrEt2dyf5bZNzkYTTouxC0n37OrMbGGq3tpv7JDD6E_Rfqua3dXYECAwEAAaOCAXIwggFuMBQGA1UdJQQNMAsGCSsGAQQBgjdPATAdBgNVHQ4EFgQUVsJIppTfox2XYoAJRIlnxAUOy2owUQYDVR0RBEowSKRGMEQxDTALBgNVBAsTBE1PUFIxMzAxBgNVBAUTKjMxNjMxKzJjNDU2Y2JjLTA1NDItNDdkOS05OWU1LWQzOWI4MTVjNTczZTAfBgNVHSMEGDAWgBRi_EPNoD6ky2cS0lvZVax7zLaKXzBTBgNVHR8ETDBKMEigRqBEhkJodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NybC9NaWNDb3JLRUtDQTIwMTFfMjAxMS0wNi0yNC5jcmwwYAYIKwYBBQUHAQEEVDBSMFAGCCsGAQUFBzAChkRodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01pY0NvcktFS0NBMjAxMV8yMDExLTA2LTI0LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQCGjTFLjxsKmyLESJueg0S2Cp8N7MOq2IALsitZHwfYw2jMhY9b9kmKvIdSqVna1moZ6_zJSOS_JY6HkWZr6dDJe9Lj7xiW_e4qPP-KDrCVb02vBnK4EktVjTdJpyMhxBMdXUcq1eGl6518oCkQ27tu0-WZjaWEVsEY_gpQj0ye2UA4HYUYgJlpT24oJRi7TeQ03Nebb-ZrUkbf9uxl0OVV_mg2R5FDwOc3REoRAgv5jnw6X7ha5hlRCl2cLF27TFrFIRQQT4eSM33eDiitXXpYmD13jqKeHhLVXr07QSwqvKe1o1UYokJngP0pTwoDnt2qRuLnZ71jw732dSPN9B57MIIF6DCCA9CgAwIBAgIKYQrRiAAAAAAAAzANBgkqhkiG9w0BAQsFADCBkTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjE7MDkGA1UEAxMyTWljcm9zb2Z0IENvcnBvcmF0aW9uIFRoaXJkIFBhcnR5IE1hcmtldHBsYWNlIFJvb3QwHhcNMTEwNjI0MjA0MTI5WhcNMjYwNjI0MjA1MTI5WjCBgDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEqMCgGA1UEAxMhTWljcm9zb2Z0IENvcnBvcmF0aW9uIEtFSyBDQSAyMDExMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxOi1ir-tVyawJsPq5_tXekQCXQcN2krldCrmsA_sbevsf7njWmMyfBEXTw7jC6c4FZOOxvXghLGamyzn9beR1gnh4sAEqKwwHN9I8wZQmmSnUX_IhU-PIIbO_i_hn_-CwO3pzc70U2piOgtDueIl_f4F-dTEFKsR4iOJjXC3pB1N7K7lnPoWwtfBy9ToxC_lme4kiwPsjfKL6sNK-0MREgt-tUeSbNzmBInr9TME6xABKnHl-YMTPP8lCS9odkb_uk--3K1xKliq-w7SeT3km2U7zCkqn_xyWaLrrpLv9jUTgMYC7ORfzJ12ze9jksGveUCEeYd_41Ko6J17B2mPFQIDAQABo4IBTzCCAUswEAYJKwYBBAGCNxUBBAMCAQAwHQYDVR0OBBYEFGL8Q82gPqTLZxLSW9lVrHvMtopfMBkGCSsGAQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1UdDwQEAwIBhjAPBgNVHRMBAf8EBTADAQH_MB8GA1UdIwQYMBaAFEVmUkPhflgRv9ZOniNVCDs6ImqoMFwGA1UdHwRVMFMwUaBPoE2GS2h0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3RzL01pY0NvclRoaVBhck1hclJvb18yMDEwLTEwLTA1LmNybDBgBggrBgEFBQcBAQRUMFIwUAYIKwYBBQUHMAKGRGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljQ29yVGhpUGFyTWFyUm9vXzIwMTAtMTAtMDUuY3J0MA0GCSqGSIb3DQEBCwUAA4ICAQDUhIj1FJQYAsoqPPsqkhwM16DR8ehSZqjuorV1epAAqi2kdlrqebe5N2pRexBk9uFk8gJnvveoG3i9us6IWGQM1lfIGaNfBdbbxtBpzkhLMrfrXdIw9cD1uLp4B6Mr_pvbNFaE7ILKrkElcJxr6f6QD9eWH-XnlB-yKgyNS_8oKRB799d8pdF2uQXIee0PkJKcwv7fb35sD3vUwUXdNFGWOQ_lXlbYGAWW9AemQrOgd_0IGfJxVsyfhiOkh8um_Vh-1GlnFZF-gfJ_E-UNi4o8h4Tr4869Q-WtLYSTjmorWnxE-lKqgcgtHLvgUt8AEfiaPcFgsOEztaOI0WUZChrnrHykwYKHTjixLw3FFIdv_Y0uvDm25-bD4OTNJ4TvlELvKYuQRkE7gRtn2PlDWWXLDbz9AJJP9HU7p6kk_FBBQHngLU8Kaid2blLtlml7rw_3hwXQRcKtUxSBH_swBKo3NmHaSmkbNNho7dYCz2yUDNPPbCJ5rbHwvAOiRmCpxAfCIYLx_fLoeTJgv9ispSIUS8rB2EvrfT9XNbLmT3W0sGADIlOukXkd1ptBHxWGVHCy3g01D3ywNHK6l2A78HnrorIcXaIWuIfF6Rv2tZclbzif45H6inmYw2kOt6McIAWX-MoUrgDXxPPAFBB1azSgG7WZYPNcsMVXTjbSMoS_njGCAcQwggHAAgEBMIGYMIGAMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSowKAYDVQQDEyFNaWNyb3NvZnQgQ29ycG9yYXRpb24gS0VLIENBIDIwMTECEzMAAAATa8knIN3tWYgAAAAAABMwDQYJYIZIAWUDBAIBBQAwDQYJKoZIhvcNAQEBBQAEggEAhabaxRIJ7nUZ-m__mIG0lII6yD-lxoeI8S83ZKTP8Qx5h5asySWl7420eGhna7zyaVRvVVIhkjOMIfcKr29LgzQpYDqPUc8aYAdGCsZKZGmHCMjEulnq5TDK79GKinzZfb2sAWXEJ68N8oNnY7faBKjHjmmJbAEz8ufE4DijgJ_NBov2xmhTZyNHQ7pB1iCdrEUGObzdJc0Qtmh3CNOEcmH0ukd8sTHE9acBBTFHS8dvreR_sP7dXClZJbJiWAFKvQn3EjCTiYizkZ4I_5xiqjHELht_ORQKN-Hnoqnl4kcRINhZRV7JlgAQDlBJLv3OTjShRO_ZWCdcu7PtwhweiSYWxMFMUJJArKlB-TaTQyiMDgAAAAAAADAAAAC9mvp3WQMyTb1gKPTnj3hLgLTZaTG_DQL9kaYeGdFPHaRS5m2yQIyoYE1BH5Jlnwq9mvp3WQMyTb1gKPTnj3hL9S-Do_qc-9aSD3IoJNvkA0U00luFByRrO5V9rG4bznq9mvp3WQMyTb1gKPTnj3hLxdnYoYbiyC0Jr6oqb38uc4cNPmT3LE4I72d5aoQPD729mvp3WQMyTb1gKPTnj3hLNjOE0U0fLgt4FWJkhMRZrVejGO9DliZgSNBYxaGbv3a9mvp3WQMyTb1gKPTnj3hLGuyEuEtsZaUSIKm-cYGWUjAhDWLW0zxImZxrKVorCga9mvp3WQMyTb1gKPTnj3hL5spo6UFGYprwP2nC-G5r72L5MLN8b7zIeLeN-YwDNOW9mvp3WQMyTb1gKPTnj3hLw6maRg2kZKBXw1htg8719K4ItxA5ee2JMnQt8O1TDGa9mvp3WQMyTb1gKPTnj3hLWPuUGu-VollDs_tfJRCg3z_kTFjJXgq4BIcpdWirl3G9mvp3WQMyTb1gKPTnj3hLU5HDovsRIQKmqh7cJa534Z9dbwnNCe6yUJkiv81Zkuq9mvp3WQMyTb1gKPTnj3hL1iYVfh1qcYvBJKuNony7ZQcsoDp7ayV9vcu9YPZe89G9mvp3WQMyTb1gKPTnj3hL0GPsKPZ-ulPxZC2_ff8zxqMq3YafYBP-Fi4sMvHL5W29mvp3WQMyTb1gKPTnj3hLKcbrUrQ8OqGLLNjtbqhgfO88-uG6_hFldVzy5hSESkS9mvp3WQMyTb1gKPTnj3hLkPvnDmnWM0CNPhcMaDLbstIJ4CclJ9-2PUnSlXKm9Ey9mvp3WQMyTb1gKPTnj3hLB17qBgWJVIugYLL-7RDaPCDH_psXzQJrlOimg7gRUji9mvp3WQMyTb1gKPTnj3hLB-bGqFhkb7HvxnkD_iixFgEfI2f-kua-KzaZnv850J69mvp3WQMyTb1gKPTnj3hLCd9fTlESCOx4uW0S0IEl_bYDho3jn29yknhSWZtlnCa9mvp3WQMyTb1gKPTnj3hLC7tDktqseribMKSsZXUxuXv6qwT5Cw2v5fm265CgY3S9mvp3WQMyTb1gKPTnj3hLDBiTOXYt8zarPdAGpGPfcVo5z7D0kkZcYA5sa9e9iYy9mvp3WQMyTb1gKPTnj3hLDQ2-ym8p7KBvMxp9cuSISxIJf7NImDoqFKDXP08QFA-9mvp3WQMyTb1gKPTnj3hLDcnz-5mWIUjDyoM2MnWNPtT8jQsAB7lbMeZSjyrNW_y9mvp3WQMyTb1gKPTnj3hLEG-s6s_s_U4wO3T0gKCAmOLQgCuTb47HdM4h8xaGaJy9mvp3WQMyTb1gKPTnj3hLF046C1tDxqYHu9NATwU0Hj3POWJnzpT4tQ4uI6nakgy9mvp3WQMyTb1gKPTnj3hLGDM0Kf8FYu2flwM-EUjc7uUtvi5JbVQQtc_WyGTS0Q-9mvp3WQMyTb1gKPTnj3hLK5nPJkIukv42X79Lww0nCGye4Ut6b_9E-y9rkAFpmTm9mvp3WQMyTb1gKPTnj3hLK78sp7jx2R8n7lK2-ypd0Em4WiubUpxdZmIGgQSwVfi9mvp3WQMyTb1gKPTnj3hLLHPZMyW6bcvlidSkxjxbk1VZ75L78FDtUMTiCFIG8X29mvp3WQMyTb1gKPTnj3hLLnCRZ4am93NRH6cYH6sPHXC1V8YyLqkjsqjTuStRr329mvp3WQMyTb1gKPTnj3hLMGYo-lR3MFcoukpGfefQOHpU9WnTdp_OXnXsidKNFZO9mvp3WQMyTb1gKPTnj3hLNgjtuvWtD0GkFKF3er8vr15nAzRnXsOZXmk1gp4MqtK9mvp3WQMyTb1gKPTnj3hLOEHSITaNFYPXXAoC5iFgOU1sTgpnYLb2B7kDYryFWwK9mvp3WQMyTb1gKPTnj3hLP86bn98-8J1UUrD5XuSBwrfwbXQ6c3lxVY5wE2rOPnO9mvp3WQMyTb1gKPTnj3hLQ5fayoOef2MHfLUMkt9DvC0vsqj1nyb8eg5L1Nl1FpK9mvp3WQMyTb1gKPTnj3hLR8wIYSfiBpqG4Dpr7yzUEPjFWm1r2zYhaMMbLOMqWt-9mvp3WQMyTb1gKPTnj3hLUYgx_nOCtRTQPhXGISKLirZUeb0Mv6PFwdD0jZwwYTW9mvp3WQMyTb1gKPTnj3hLWulJ6ohV65PkOdvGW9ouQoUsL99nifoUZzbjw0EPK1y9mvp3WQMyTb1gKPTnj3hLax0TgHjkQYqmjet7s14GYJLPR57rjOTNEufQcsy0L2a9mvp3WQMyTb1gKPTnj3hLbIhUR43VWeKTUbgmwGy4v-8rlK01ODWHctGT-C7RyhG9mvp3WQMyTb1gKPTnj3hLbxQo_3HJ2w7Vrx8ue7_Lq2R8wmXd9bKTzbYm9Qo6eF69mvp3WQMyTb1gKPTnj3hLcfKQb9IiSX5Uo0ZiqySX_MgQIHcP9RNo6ePZv8v9Y3W9mvp3WQMyTb1gKPTnj3hLcms-tlQEajDz-D2bls4D9nDpqAbRcIoDceYtxJ0sI8G9mvp3WQMyTb1gKPTnj3hLcuC9GGfPXZ1WqxWK3zvdvIK_MqjYqh2MXi9t8pQo1ti9mvp3WQMyTb1gKPTnj3hLeCevmTYs-vBxfa3ksb_gQ4rRccFa3cJIt1v4yqRLssW9mvp3WQMyTb1gKPTnj3hLgai5ZbuE04drlCmpVIHMlVMYz6oUEtgIyKM7_TP_8OS9mvp3WQMyTb1gKPTnj3hLgts7zrT2CEPOnZfD0YfNm1lBzT3oEA5YbyvaVjdXX2e9mvp3WQMyTb1gKPTnj3hLiVqXhfYXyh1-1E_BoUcLcfPxIjhi2f-dzDri35IWPa-9mvp3WQMyTb1gKPTnj3hLitZIWfGVtfWNr6qUC2phZ6zWeohuj0aTZBdyIcVZRbm9mvp3WQMyTb1gKPTnj3hLi_Q0tJ4AzPcVAqLNkAhlywHsOz2gPDW-UF_fe9Vj9SG9mvp3WQMyTb1gKPTnj3hLjY6iic_nChwHq3NlyyjuUe3TPPJQbeiI-63WDr-ASBy9mvp3WQMyTb1gKPTnj3hLmZjTY8SRvha9dLoQuU2SkQAWEXNv3KZDo2ZkvA8xWkK9mvp3WQMyTb1gKPTnj3hLnkppFzFhaC5V_ej-9WDriOwf_tyvBAAfZsDK9weytzS9mvp3WQMyTb1gKPTnj3hLprUVHzZV06KvDUcnWXlr5KQgDlSVp9hpdUxISIV0CKe9mvp3WQMyTb1gKPTnj3hLp_MvUI1OsP6tmgh--U7RugrsXeb372_wpiuTvt9dRY29mvp3WQMyTb1gKPTnj3hLrWgm4ZRtJtPq82hciNl9hd47Tcs9DuKugccFYNE8VyC9mvp3WQMyTb1gKPTnj3hLruuuMVEnEnPtlaouZxE57TGphWcwOjMimPg3CanVWqG9mvp3WQMyTb1gKPTnj3hLr-IDCvt9LNoT-fozOgLjT2dRr-wRsBDbzUQf30xAArO9mvp3WQMyTb1gKPTnj3hLtU8e5jZjH61oBY07CTcDGsG5DMsXBio5HMpor9vkDVW9mvp3WQMyTb1gKPTnj3hLuPB42YOiSsQzIWOTiDUUzZMsM68Y591wiEyCNfQnVza9mvp3WQMyTb1gKPTnj3hLuXoIiQWcA1_x1UtttTsRuXZmaNn5VSR8AosoN9egTNm9mvp3WQMyTb1gKPTnj3hLvIemaOgZZkictQjugFGDwZ5qzSTPF3mcoGLS44TaDqe9mvp3WQMyTb1gKPTnj3hLxAm9rEd1rdjbkqoitbcY-4yUoUYsH-mkFrldijOIwvy9mvp3WQMyTb1gKPTnj3hLxhfBqLHuKoEcKLWoG0yD18mLWwwnKB1hAgfr5pLCln-9mvp3WQMyTb1gKPTnj3hLyQ8zZhe45_mDl1QTyZfxC3PrJn_YoQy5472_xmer24u9mvp3WQMyTb1gKPTnj3hLy2uFi0DToJh2WBW1ksFRSklgT6_WCBnaiNenbpd4_ve9mvp3WQMyTb1gKPTnj3hLzjv6vlnWfOisjf1KFvfEPvnCJFE_vGVZV9c1-in1QM69mvp3WQMyTb1gKPTnj3hL2MvrlzX1Zys2fk-WzcdJaWFdFwdK6WxyTULOAhb48_q9mvp3WQMyTb1gKPTnj3hL6Swi6ztWQtZcHsLK8kfSWUc47rt_s4QaRJVvWeKw0fq9mvp3WQMyTb1gKPTnj3hL_d1uPSnqhMd0Pa1KG9vHALX-wbOR-TJAkIasxx3W29i9mvp3WQMyTb1gKPTnj3hL_mOoT3gsydP88sz5_BH70Ddgh4dY0mKF7RJmm9xubQG9mvp3WQMyTb1gKPTnj3hL_s-yMtEumUttSF0scWdyiqVSWYStXKYedRYiHweaFDa9mvp3WQMyTb1gKPTnj3hLyhcdYUqNfhIck5SM0P5V05mB-dEaqW4DRQpBUifCxlu9mvp3WQMyTb1gKPTnj3hLVbmbDeU9vP5IWqnHN88_thbvPZH6tZmqfKsZ7adjtbq9mvp3WQMyTb1gKPTnj3hLd90ZD6MNiP9eOwEaCuYeYgl4DBMLU17Lh-bwiIoLay-9mvp3WQMyTb1gKPTnj3hLyDyxOSKtmfVgdEZ13TfMlNytWh_Lpkcv7jQRcdk56IS9mvp3WQMyTb1gKPTnj3hLOwKHUz4Mw9DsGqgjy_CpQarYchV50cSZgC3Rw6Y2uKm9mvp3WQMyTb1gKPTnj3hLk5ru9PX6UeIzQMPy5JBIzohyUmr991LDp_Oj8ryfYEm9mvp3WQMyTb1gKPTnj3hLZFdb2RJ4mi4UrVb2NB9Sr2v4DPlEAHhZdenwTi1k10W9mvp3WQMyTb1gKPTnj3hLRcfIrnUKz7tI_DdSfWQS3WRNrtiRPM2KJMlNhWln344=
      fileType: BIN
  source: https://www.googleapis.com/compute/v1/projects/os-ds-498615/zones/us-central1-a/disks/vm-gateway
  type: PERSISTENT
fingerprint: 724ns5R78ck=
id: '5732248125763565228'
kind: compute#instance
labelFingerprint: 42WmSpB8rSM=
lastStartTimestamp: '2026-06-06T13:51:25.784-07:00'
machineType: https://www.googleapis.com/compute/v1/projects/os-ds-498615/zones/us-central1-a/machineTypes/e2-medium
metadata:
  fingerprint: jVqDioPAuhs=
  items:
  - key: startup-script
    value: apt-get update && apt-get install -y docker.io git curl && curl -L https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64
      -o /usr/bin/docker-compose && chmod +x /usr/bin/docker-compose
  kind: compute#metadata
name: vm-gateway
networkInterfaces:
- accessConfigs:
  - kind: compute#accessConfig
    name: external-nat
    natIP: 104.154.143.133
    networkTier: PREMIUM
    type: ONE_TO_ONE_NAT
  fingerprint: O6yo1dDIWqY=
  kind: compute#networkInterface
  name: nic0
  network: https://www.googleapis.com/compute/v1/projects/os-ds-498615/global/networks/salud-vpc
  networkIP: 10.128.0.30
  stackType: IPV4_ONLY
  subnetwork: https://www.googleapis.com/compute/v1/projects/os-ds-498615/regions/us-central1/subnetworks/salud-subnet
resourceStatus:
  effectiveInstanceMetadata:
    vmDnsSettingMetadataValue: ZonalOnly
satisfiesPzi: true
scheduling:
  automaticRestart: true
  onHostMaintenance: MIGRATE
  preemptible: false
  provisioningModel: STANDARD
selfLink: https://www.googleapis.com/compute/v1/projects/os-ds-498615/zones/us-central1-a/instances/vm-gateway
serviceAccounts:
- email: 419113283355-compute@developer.gserviceaccount.com
  scopes:
  - https://www.googleapis.com/auth/devstorage.read_only
  - https://www.googleapis.com/auth/logging.write
  - https://www.googleapis.com/auth/monitoring.write
  - https://www.googleapis.com/auth/pubsub
  - https://www.googleapis.com/auth/service.management.readonly
  - https://www.googleapis.com/auth/servicecontrol
  - https://www.googleapis.com/auth/trace.append
shieldedInstanceConfig:
  enableIntegrityMonitoring: true
  enableSecureBoot: false
  enableVtpm: true
shieldedInstanceIntegrityPolicy:
  updateAutoLearnPolicy: true
startRestricted: false
status: RUNNING
tags:
  fingerprint: 6smc4R4d39I=
  items:
  - http-server
  - https-server
zone: https://www.googleapis.com/compute/v1/projects/os-ds-498615/zones/us-central1-a
# 3. Obtener únicamente la IP pública externa de la VM (para acceder desde el navegador)
marianoemunozr@cloudshell:~ (os-ds-498615)$ gcloud compute instances describe vm-gateway \
    --zone=us-central1-a \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
104.154.143.133
# 4. Obtener la IP privada interna (la que usará Nginx para comunicarse con las otras VMs)
marianoemunozr@cloudshell:~ (os-ds-498615)$ gcloud compute instances describe vm-gateway \
    --zone=us-central1-a \
    --format="get(networkInterfaces[0].networkIP)"
10.128.0.30
# 5. Conectarse a la VM mediante SSH desde Cloud Shell
marianoemunozr@cloudshell:~ (os-ds-498615)$ gcloud compute ssh vm-gateway --zone=us-central1-a
Warning: Permanently added 'compute.5732248125763565228' (ED25519) to the list of known hosts.
Welcome to Ubuntu 22.04.5 LTS (GNU/Linux 6.8.0-1060-gcp x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Sat Jun  6 23:07:34 UTC 2026

  System load:  0.0               Processes:             109
  Usage of /:   28.5% of 9.51GB   Users logged in:       0
  Memory usage: 8%                IPv4 address for ens4: 10.128.0.30
  Swap usage:   0%

Expanded Security Maintenance for Applications is not enabled.

7 updates can be applied immediately.
6 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable

2 additional security updates can be applied with ESM Apps.
Learn more about enabling ESM Apps service at https://ubuntu.com/esm



The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.
```

## Dentro del SSH

```bash
marianoemunozr@vm-gateway:~$ sudo apt-get update
Hit:1 http://us-central1.gce.archive.ubuntu.com/ubuntu jammy InRelease
Hit:2 http://us-central1.gce.archive.ubuntu.com/ubuntu jammy-updates InRelease
Hit:3 http://us-central1.gce.archive.ubuntu.com/ubuntu jammy-backports InRelease
Hit:4 http://security.ubuntu.com/ubuntu jammy-security InRelease
Reading package lists... Done
marianoemunozr@vm-gateway:~$ sudo apt-get install -y docker.io git curl
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
curl is already the newest version (7.81.0-1ubuntu1.24).
git is already the newest version (1:2.34.1-1ubuntu1.17).
docker.io is already the newest version (29.1.3-0ubuntu3~22.04.2).
0 upgraded, 0 newly installed, 0 to remove and 7 not upgraded.
marianoemunozr@vm-gateway:~$ sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" -o /usr/bin/docker-compose
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
100 60.0M  100 60.0M    0     0  47.4M      0  0:00:01  0:00:01 --:--:-- 86.2M
marianoemunozr@vm-gateway:~$ sudo chmod +x /usr/bin/docker-compose
marianoemunozr@vm-gateway:~$ git clone https://github.com/maruzs/Proyecto-OSDS.git
Cloning into 'Proyecto-OSDS'...
remote: Enumerating objects: 193, done.
remote: Counting objects: 100% (193/193), done.
remote: Compressing objects: 100% (129/129), done.
remote: Total 193 (delta 88), reused 154 (delta 49), pack-reused 0 (from 0)
Receiving objects: 100% (193/193), 917.67 KiB | 7.11 MiB/s, done.
Resolving deltas: 100% (88/88), done.
marianoemunozr@vm-gateway:~$ cd Proyecto-OSDS
marianoemunozr@vm-gateway:~/Proyecto-OSDS$ git checkout mariano
Branch 'mariano' set up to track remote branch 'mariano' from 'origin'.
Switched to a new branch 'mariano'
marianoemunozr@vm-gateway:~/Proyecto-OSDS$ git pull
Already up to date.
marianoemunozr@vm-gateway:~/Proyecto-OSDS$ ls
Docs  GCPCommands.md  README.md  apps  config  docker-compose.yml  package-lock.json  package.json  pnpm-lock.yaml  pnpm-workspace.yaml  roles.md  scratch  scripts
marianoemunozr@vm-gateway:~/Proyecto-OSDS$
```

## Prueba del nuevo codigo

```bash
marianoemunozr@vm-gateway:~/Proyecto-OSDS$ git pull origin mariano
From https://github.com/maruzs/Proyecto-OSDS
 * branch            mariano    -> FETCH_HEAD
Already up to date.
marianoemunozr@vm-gateway:~/Proyecto-OSDS$ sudo docker-compose up --build -d nginx-proxy
WARN[0000] /home/marianoemunozr/Proyecto-OSDS/docker-compose.yml: `version` is obsolete
[+] Running 25/25
 ✔ db-nube Pulled                                                                                                                                                                                                                         21.2s
   ✔ b70086fdbb25 Download complete                                                                                                                                                                                                        0.1s
 ✔ nginx-proxy Pulled                                                                                                                                                                                                                      5.0s
   ✔ 43f834d60d8a Pull complete                                                                                                                                                                                                            0.4s
   ✔ 6a0ac1617861 Pull complete                                                                                                                                                                                                            1.5s
   ✔ abaae85d1626 Pull complete                                                                                                                                                                                                            2.1s
   ✔ fbaed3f7fcbe Pull complete                                                                                                                                                                                                            4.0s
   ✔ 94d083cf706a Pull complete                                                                                                                                                                                                            0.4s
   ✔ e654dbbbb9e1 Pull complete                                                                                                                                                                                                            0.5s
   ✔ a5008f4a4b25 Pull complete                                                                                                                                                                                                            0.4s
   ✔ de1b677d8c00 Pull complete                                                                                                                                                                                                            0.4s
   ✔ ab556c9e4280 Download complete                                                                                                                                                                                                        0.1s
   ✔ 2d8223aa4623 Download complete                                                                                                                                                                                                        0.2s
 ✔ db-local Pulled                                                                                                                                                                                                                        21.3s
   ✔ ca93057fc4d5 Pull complete                                                                                                                                                                                                            0.6s
   ✔ ae6182536390 Pull complete                                                                                                                                                                                                            0.6s
   ✔ d9c20c681f9b Pull complete                                                                                                                                                                                                            0.6s
   ✔ 24c411bedd9e Pull complete                                                                                                                                                                                                           20.2s
   ✔ 377e1ef4f477 Pull complete                                                                                                                                                                                                            2.0s
   ✔ 7b77effdbf0f Pull complete                                                                                                                                                                                                            0.6s
   ✔ cdda83573b7e Pull complete                                                                                                                                                                                                            1.6s
   ✔ 3709d6f016e4 Pull complete                                                                                                                                                                                                           19.6s
   ✔ 2eeda6440fdc Pull complete                                                                                                                                                                                                            1.9s
   ✔ bba062d0aaf6 Pull complete                                                                                                                                                                                                            1.7s
   ✔ a94133f4ff99 Download complete                                                                                                                                                                                                        0.2s
[+] Building 21.0s (17/17) FINISHED                                                                                                                                                                                              docker:default
 => [app-estaciones internal] load build definition from Dockerfile                                                                                                                                                                        0.0s
 => => transferring dockerfile: 157B                                                                                                                                                                                                       0.0s
 => [app-terminales internal] load build definition from Dockerfile                                                                                                                                                                        0.0s
 => => transferring dockerfile: 155B                                                                                                                                                                                                       0.0s
 => [app-terminales internal] load metadata for docker.io/library/node:18-alpine                                                                                                                                                           0.6s
 => [app-estaciones internal] load .dockerignore                                                                                                                                                                                           0.0s
 => => transferring context: 67B                                                                                                                                                                                                           0.0s
 => [app-terminales internal] load .dockerignore                                                                                                                                                                                           0.0s
 => => transferring context: 67B                                                                                                                                                                                                           0.0s
 => [app-estaciones 1/5] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e                                                                                                     3.3s
 => => resolve docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e                                                                                                                    0.1s
 => => sha256:25ff2da83641908f65c3a74d80409d6b1b62ccfaab220b9ea70b80df5a2e0549 446B / 446B                                                                                                                                                 0.1s
 => => sha256:1e5a4c89cee5c0826c540ab06d4b6b491c96eda01837f430bd47f0d26702d6e3 1.26MB / 1.26MB                                                                                                                                             0.2s
 => => sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 40.01MB / 40.01MB                                                                                                                                           1.1s
 => => sha256:f18232174bc91741fdf3da96d85011092101a032a93a388b79e99e69c2d5c870 3.64MB / 3.64MB                                                                                                                                             0.3s
 => => extracting sha256:f18232174bc91741fdf3da96d85011092101a032a93a388b79e99e69c2d5c870                                                                                                                                                  0.3s
 => => extracting sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e                                                                                                                                                  1.9s
 => => extracting sha256:1e5a4c89cee5c0826c540ab06d4b6b491c96eda01837f430bd47f0d26702d6e3                                                                                                                                                  0.1s
 => => extracting sha256:25ff2da83641908f65c3a74d80409d6b1b62ccfaab220b9ea70b80df5a2e0549                                                                                                                                                  0.0s
 => [app-estaciones internal] load build context                                                                                                                                                                                           0.1s
 => => transferring context: 49.13kB                                                                                                                                                                                                       0.0s
 => [app-terminales internal] load build context                                                                                                                                                                                           0.1s
 => => transferring context: 3.09kB                                                                                                                                                                                                        0.0s
 => [app-estaciones 2/5] WORKDIR /app                                                                                                                                                                                                      2.2s
 => [app-terminales 3/5] COPY package*.json ./                                                                                                                                                                                             0.1s
 => [app-estaciones 3/5] COPY package*.json ./                                                                                                                                                                                             0.1s
 => [app-terminales 4/5] RUN npm install                                                                                                                                                                                                  12.2s
 => [app-estaciones 4/5] RUN npm install                                                                                                                                                                                                   6.2s
 => [app-estaciones 5/5] COPY . .                                                                                                                                                                                                          0.1s
 => [app-estaciones] exporting to image                                                                                                                                                                                                    1.9s
 => => exporting layers                                                                                                                                                                                                                    1.1s
 => => exporting manifest sha256:ae07d1522d518ffc63982cea71b608fa19d243be1f132764c716d329af0fa96e                                                                                                                                          0.0s
 => => exporting config sha256:5ff0776a30d4933f81a08f6aabe98a41643354ef69d4c5b7acaead9a8c34e3e3                                                                                                                                            0.0s
 => => exporting attestation manifest sha256:999e46002009c1003218b74d8a6b4a38cc970c48ad2179f30fb6d282ebcccf81                                                                                                                              0.0s
 => => exporting manifest list sha256:3d9601dcc45c466205d984dc3cd3a90a16374197f01a2260e10d968d828f0b3f                                                                                                                                     0.0s
 => => naming to docker.io/library/proyecto-osds-app-estaciones:latest                                                                                                                                                                     0.0s
 => => unpacking to docker.io/library/proyecto-osds-app-estaciones:latest                                                                                                                                                                  0.7s
 => [app-terminales 5/5] COPY . .                                                                                                                                                                                                          0.1s
 => [app-terminales] exporting to image                                                                                                                                                                                                    2.3s
 => => exporting layers                                                                                                                                                                                                                    1.3s
 => => exporting manifest sha256:73c6b56a482b8f744f5b09160bbfa7e4229f5bd7ce17aab6371ac253c9ac94b9                                                                                                                                          0.0s
 => => exporting config sha256:5341291a15cf60af590adf23446f888eacab7e31bfe937829c596525a25e0186                                                                                                                                            0.0s
 => => exporting attestation manifest sha256:ce51a4421f3bc721d093d20f1f404f5e6d6eefda0b28bf5f6818dbc03ec4394e                                                                                                                              0.0s
 => => exporting manifest list sha256:9575e14e9501fa3d9df39720e387161ef2d0b44fa8c6ff2cec0dcc3b964e5ccc                                                                                                                                     0.0s
 => => naming to docker.io/library/proyecto-osds-app-terminales:latest                                                                                                                                                                     0.0s
 => => unpacking to docker.io/library/proyecto-osds-app-terminales:latest                                                                                                                                                                  0.8s
[+] Running 10/10
 ✔ Network hospital_net      Created                                                                                                                                                                                                       0.1s
 ✔ Network cloud_net         Created                                                                                                                                                                                                       0.1s
 ✔ Network dmz_net           Created                                                                                                                                                                                                       0.1s
 ✔ Volume "db_local_data"    Created                                                                                                                                                                                                       0.0s
 ✔ Volume "db_cloud_data"    Created                                                                                                                                                                                                       0.0s
 ✔ Container db-nube         Started                                                                                                                                                                                                       2.4s
 ✔ Container db-local        Started                                                                                                                                                                                                       2.4s
 ✔ Container app-estaciones  Started                                                                                                                                                                                                       2.7s
 ✔ Container app-terminales  Started                                                                                                                                                                                                       2.6s
 ✔ Container nginx-proxy     Started
marianoemunozr@vm-gateway:~/Proyecto-OSDS$ sudo docker-compose logs -f
WARN[0000] /home/marianoemunozr/Proyecto-OSDS/docker-compose.yml: `version` is obsolete
nginx-proxy     | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
nginx-proxy     | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
nginx-proxy     | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
nginx-proxy     | 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
nginx-proxy     | 10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
nginx-proxy     | /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
nginx-proxy     | /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
nginx-proxy     | /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
nginx-proxy     | /docker-entrypoint.sh: Configuration complete; ready for start up
db-local        | The files belonging to this database system will be owned by user "postgres".
db-local        | This user must also own the server process.
db-local        |
db-local        | The database cluster will be initialized with locale "en_US.utf8".
db-local        | The default database encoding has accordingly been set to "UTF8".
db-local        | The default text search configuration will be set to "english".
db-local        |
db-local        | Data page checksums are disabled.
db-local        |
db-local        | fixing permissions on existing directory /var/lib/postgresql/data ... ok
db-local        | creating subdirectories ... ok
db-local        | selecting dynamic shared memory implementation ... posix
db-local        | selecting default max_connections ... 100
db-local        | selecting default shared_buffers ... 128MB
db-local        | selecting default time zone ... UTC
db-local        | creating configuration files ... ok
app-terminales  |
app-terminales  | > terminales-administrativas@1.0.0 start
app-terminales  | > node server.js
app-terminales  |
app-terminales  | [SISTEMA] Servidor de Terminales Administrativas operativo en puerto 8002
db-local        | running bootstrap script ... ok
db-local        | sh: locale: not found
db-local        | 2026-06-06 23:15:21.120 UTC [34] WARNING:  no usable system locales were found
db-local        | performing post-bootstrap initialization ... ok
db-local        | initdb: warning: enabling "trust" authentication for local connections
app-estaciones  |
app-estaciones  | > estaciones-medicas@1.0.0 start
app-estaciones  | > node server.js
app-estaciones  |
db-local        | initdb: hint: You can change this by editing pg_hba.conf or using the option -A, or --auth-local and --auth-host, the next time you run initdb.
db-local        | syncing data to disk ... ok
db-local        |
db-local        |
db-local        | Success. You can now start the database server using:
db-local        |
db-local        |     pg_ctl -D /var/lib/postgresql/data -l logfile start
db-local        |
db-local        | waiting for server to start....2026-06-06 23:15:22.988 UTC [40] LOG:  starting PostgreSQL 16.14 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit
db-local        | 2026-06-06 23:15:22.992 UTC [40] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-local        | 2026-06-06 23:15:23.006 UTC [43] LOG:  database system was shut down at 2026-06-06 23:15:22 UTC
db-local        | 2026-06-06 23:15:23.023 UTC [40] LOG:  database system is ready to accept connections
db-local        |  done
db-local        | server started
db-local        | CREATE DATABASE
db-local        |
db-local        |
db-local        | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/init.sql
db-local        | CREATE EXTENSION
db-local        | CREATE TABLE
db-local        | DROP PUBLICATION
db-local        | psql:/docker-entrypoint-initdb.d/init.sql:12: NOTICE:  publication "pub_local_a_nube" does not exist, skipping
db-local        | CREATE PUBLICATION
db-local        | INSERT 0 1
db-local        | INSERT 0 1
app-estaciones  | [SISTEMA] Servidor Estaciones Medicas operativo en puerto 8001
db-local        | INSERT 0 1
db-local        |
db-local        |
db-local        | waiting for server to shut down....2026-06-06 23:15:23.365 UTC [40] LOG:  received fast shutdown request
db-local        | 2026-06-06 23:15:23.369 UTC [40] LOG:  aborting any active transactions
db-local        | 2026-06-06 23:15:23.389 UTC [40] LOG:  background worker "logical replication launcher" (PID 46) exited with exit code 1
db-local        | 2026-06-06 23:15:23.389 UTC [41] LOG:  shutting down
db-local        | 2026-06-06 23:15:23.392 UTC [41] LOG:  checkpoint starting: shutdown immediate
db-local        | 2026-06-06 23:15:23.579 UTC [41] LOG:  checkpoint complete: wrote 940 buffers (5.7%); 0 WAL file(s) added, 0 removed, 0 recycled; write=0.103 s, sync=0.071 s, total=0.191 s; sync files=305, longest=0.016 s, average=0.001 s; distance=4310 kB, estimate=4310 kB; lsn=0/1927E98, redo lsn=0/1927E98
db-local        | 2026-06-06 23:15:23.596 UTC [40] LOG:  database system is shut down
db-local        |  done
db-local        | server stopped
db-local        |
db-local        | PostgreSQL init process complete; ready for start up.
db-local        |
db-local        | 2026-06-06 23:15:23.724 UTC [1] LOG:  starting PostgreSQL 16.14 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit
db-local        | 2026-06-06 23:15:23.724 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
db-local        | 2026-06-06 23:15:23.724 UTC [1] LOG:  listening on IPv6 address "::", port 5432
db-local        | 2026-06-06 23:15:23.732 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-local        | 2026-06-06 23:15:23.743 UTC [58] LOG:  database system was shut down at 2026-06-06 23:15:23 UTC
db-local        | 2026-06-06 23:15:23.766 UTC [1] LOG:  database system is ready to accept connections
db-nube         | The files belonging to this database system will be owned by user "postgres".
db-nube         | This user must also own the server process.
db-nube         |
db-nube         | The database cluster will be initialized with locale "en_US.utf8".
db-nube         | The default database encoding has accordingly been set to "UTF8".
db-nube         | The default text search configuration will be set to "english".
db-nube         |
db-nube         | Data page checksums are disabled.
db-nube         |
db-nube         | fixing permissions on existing directory /var/lib/postgresql/data ... ok
db-nube         | creating subdirectories ... ok
db-nube         | selecting dynamic shared memory implementation ... posix
db-nube         | selecting default max_connections ... 100
db-nube         | selecting default shared_buffers ... 128MB
db-nube         | selecting default time zone ... UTC
db-nube         | creating configuration files ... ok
db-nube         | running bootstrap script ... ok
db-nube         | sh: locale: not found
db-nube         | 2026-06-06 23:15:21.122 UTC [34] WARNING:  no usable system locales were found
db-nube         | performing post-bootstrap initialization ... ok
db-nube         | initdb: warning: enabling "trust" authentication for local connections
db-nube         | initdb: hint: You can change this by editing pg_hba.conf or using the option -A, or --auth-local and --auth-host, the next time you run initdb.
db-nube         | syncing data to disk ... ok
db-nube         |
db-nube         |
db-nube         | Success. You can now start the database server using:
db-nube         |
db-nube         |     pg_ctl -D /var/lib/postgresql/data -l logfile start
db-nube         |
db-nube         | waiting for server to start....2026-06-06 23:15:22.989 UTC [40] LOG:  starting PostgreSQL 16.14 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit
db-nube         | 2026-06-06 23:15:22.993 UTC [40] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-nube         | 2026-06-06 23:15:23.010 UTC [43] LOG:  database system was shut down at 2026-06-06 23:15:22 UTC
db-nube         | 2026-06-06 23:15:23.026 UTC [40] LOG:  database system is ready to accept connections
db-nube         |  done
db-nube         | server started
db-nube         | CREATE DATABASE
db-nube         |
db-nube         |
db-nube         | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/init.sql
db-nube         | CREATE EXTENSION
db-nube         | CREATE TABLE
db-nube         | psql:/docker-entrypoint-initdb.d/init.sql:12: NOTICE:  publication "pub_nube_a_local" does not exist, skipping
db-nube         | DROP PUBLICATION
db-nube         | CREATE PUBLICATION
db-nube         | psql:/docker-entrypoint-initdb.d/init.sql:15: NOTICE:  subscription "sub_desde_local" does not exist, skipping
db-nube         | DROP SUBSCRIPTION
db-nube         | 2026-06-06 23:15:23.312 UTC [53] ERROR:  could not connect to the publisher: connection to server at "db-local" (172.20.0.2), port 5432 failed: Connection refused
db-nube         |               Is the server running on that host and accepting TCP/IP connections?
db-nube         | 2026-06-06 23:15:23.312 UTC [53] STATEMENT:  CREATE SUBSCRIPTION sub_desde_local
db-nube         |       CONNECTION 'host=db-local port=5432 dbname=clinica user=postgres password=postgres_secure_pass'
db-nube         |       PUBLICATION pub_local_a_nube
db-nube         |       WITH (copy_data = false);
db-nube         | psql:/docker-entrypoint-initdb.d/init.sql:19: ERROR:  could not connect to the publisher: connection to server at "db-local" (172.20.0.2), port 5432 failed: Connection refused
db-nube         |       Is the server running on that host and accepting TCP/IP connections?
db-nube         |
db-nube         | PostgreSQL Database directory appears to contain a database; Skipping initialization
db-nube         |
db-nube         | 2026-06-06 23:15:24.053 UTC [1] LOG:  starting PostgreSQL 16.14 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit
db-nube         | 2026-06-06 23:15:24.053 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
db-nube         | 2026-06-06 23:15:24.053 UTC [1] LOG:  listening on IPv6 address "::", port 5432
db-nube         | 2026-06-06 23:15:24.058 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-nube         | 2026-06-06 23:15:24.068 UTC [28] LOG:  database system was interrupted; last known up at 2026-06-06 23:15:23 UTC
db-nube         | 2026-06-06 23:15:24.173 UTC [28] LOG:  database system was not properly shut down; automatic recovery in progress
db-nube         | 2026-06-06 23:15:24.178 UTC [28] LOG:  redo starts at 0/14F2630
db-nube         | 2026-06-06 23:15:24.228 UTC [28] LOG:  invalid record length at 0/1927998: expected at least 24, got 0
db-nube         | 2026-06-06 23:15:24.228 UTC [28] LOG:  redo done at 0/1927900 system usage: CPU: user: 0.00 s, system: 0.03 s, elapsed: 0.05 s
db-nube         | 2026-06-06 23:15:24.236 UTC [26] LOG:  checkpoint starting: end-of-recovery immediate wait
db-nube         | 2026-06-06 23:15:24.336 UTC [26] LOG:  checkpoint complete: wrote 939 buffers (5.7%); 0 WAL file(s) added, 0 removed, 0 recycled; write=0.066 s, sync=0.025 s, total=0.103 s; sync files=305, longest=0.005 s, average=0.001 s; distance=4308 kB, estimate=4308 kB; lsn=0/1927998, redo lsn=0/1927998
db-nube         | 2026-06-06 23:15:24.343 UTC [1] LOG:  database system is ready to accept connections
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:16:52 +0000] "GET / HTTP/1.1" 200 31863 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:16:52 +0000] "GET /favicon.ico HTTP/1.1" 200 31863 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:03 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEP2t HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEP2t", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:03 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEP2t HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:04 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEPSC HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:04 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEPSC HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEPSC", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:07 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEQ9W HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:07 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEQ9W HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEQ9W", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 2026/06/06 23:17:12 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVERPv HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVERPv", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:12 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVERPv HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:18 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVESu1 HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVESu1", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:18 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVESu1 HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:24 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEUL_ HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEUL_", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:24 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEUL_ HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:29 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEVcM HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEVcM", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:29 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEVcM HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:33 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEWW2 HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:33 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEWW2 HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEWW2", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 2026/06/06 23:17:34 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEWgy HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEWgy", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:34 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEWgy HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:36 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEXEG HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:36 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEXEG HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEXEG", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 2026/06/06 23:17:39 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEXxg HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEXxg", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:39 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEXxg HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:44 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEZEJ HTTP/1.1", upstream: "http://10.128.0.10:8001/ws-medicas/?EIO=4&transport=polling&t=PwVEZEJ", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:44 +0000] "GET /ws-medicas/?EIO=4&transport=polling&t=PwVEZEJ HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:48 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEaCK HTTP/1.1", upstream: "http://10.128.0.20:8002/ws-administrativas/?EIO=4&transport=polling&t=PwVEaCK", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:48 +0000] "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEaCK HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:50 +0000] "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEaa4 HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:50 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEaa4 HTTP/1.1", upstream: "http://10.128.0.20:8002/ws-administrativas/?EIO=4&transport=polling&t=PwVEaa4", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:52 +0000] "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEb77 HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:17:52 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEb77 HTTP/1.1", upstream: "http://10.128.0.20:8002/ws-administrativas/?EIO=4&transport=polling&t=PwVEb77", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 2026/06/06 23:17:57 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEcCq HTTP/1.1", upstream: "http://10.128.0.20:8002/ws-administrativas/?EIO=4&transport=polling&t=PwVEcCq", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:17:57 +0000] "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEcCq HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:18:02 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEdde HTTP/1.1", upstream: "http://10.128.0.20:8002/ws-administrativas/?EIO=4&transport=polling&t=PwVEdde", host: "104.154.143.133", referrer: "http://104.154.143.133/"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:18:02 +0000] "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEdde HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 179.60.65.125 - - [06/Jun/2026:23:18:08 +0000] "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEf5O HTTP/1.1" 502 552 "http://104.154.143.133/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0"
nginx-proxy     | 2026/06/06 23:18:08 [error] 30#30: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 179.60.65.125, server: localhost, request: "GET /ws-administrativas/?EIO=4&transport=polling&t=PwVEf5O HTTP/1.1", upstream: "http://10.128.0.20:8002/ws-administrativas/?EIO=4&transport=polling&t=PwVEf5O", host: "104.154.143.133", referrer: "http://104.154.143.133/
```
