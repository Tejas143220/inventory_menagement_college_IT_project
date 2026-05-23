import json, urllib.request, sys
url='http://127.0.0.1:8000'
# Register
reg = {'username':'devadmin','email':'devadmin@example.com','password':'password123'}
try:
    req=urllib.request.Request(url+'/register', data=json.dumps(reg).encode(), headers={'Content-Type':'application/json'})
    resp=urllib.request.urlopen(req)
    print('register', resp.getcode())
except Exception as e:
    print('register error', e)
# Login
login = {'email':'devadmin@example.com','password':'password123'}
try:
    req=urllib.request.Request(url+'/login', data=json.dumps(login).encode(), headers={'Content-Type':'application/json'})
    resp=urllib.request.urlopen(req)
    body=json.loads(resp.read().decode())
    token=body.get('access_token')
    print('login ok, token_len=', len(token) if token else None)
except Exception as e:
    print('login error', e)
    sys.exit(1)
# Call /sales
try:
    req=urllib.request.Request(url+'/sales', headers={'Authorization':f'Bearer {token}'})
    resp=urllib.request.urlopen(req)
    print('sales', resp.getcode())
    print(resp.read().decode())
except Exception as e:
    print('sales error', e)