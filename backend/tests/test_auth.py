def test_login_success(client, test_user):
    response = client.post(
        "/v1/auth/login",
        json={"username": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["id"] == test_user.id


def test_login_invalid_credentials(client, test_user):
    response = client.post(
        "/v1/auth/login",
        json={"username": "test@example.com", "password": "wrongpass"}
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post(
        "/v1/auth/login",
        json={"username": "nonexistent@example.com", "password": "testpass123"}
    )
    assert response.status_code == 401
