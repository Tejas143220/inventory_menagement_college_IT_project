import json
import urllib.request
import urllib.error

url = 'http://127.0.0.1:8000'
login = {'email': 'devadmin@example.com', 'password': 'password123'}
try:
    req = urllib.request.Request(url + '/login', data=json.dumps(login).encode(), headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req)
    body = json.loads(resp.read().decode())
    token = body.get('access_token')
    print('token_len', len(token) if token else None)
except Exception as e:
    print('login error', e)
    raise
try:
    req = urllib.request.Request(url + '/sales', headers={'Authorization': f'Bearer {token}'})
    resp = urllib.request.urlopen(req)
    print('sales ok', resp.getcode())
    data = resp.read().decode()
    print(data[:4000])
except urllib.error.HTTPError as e:
    print('HTTPError', e.code)
    try:
        print(e.read().decode())
    except Exception as ee:
        print('body error', ee)
except Exception as e:
    print('other error', e)
