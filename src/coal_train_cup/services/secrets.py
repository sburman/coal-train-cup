import toml


def get_secrets() -> dict:
    secrets_path = ".streamlit/secrets.toml"
    with open(secrets_path, "r") as file:
        secrets = toml.load(file)

    return secrets
