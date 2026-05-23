import json, urllib.request, sys
url='http://127.0.0.1:8000'
headers={'Content-Type':'application/json'}

# Login (existing devadmin)
login = {'email':'devadmin@example.com','password':'password123'}
req=urllib.request.Request(url+'/login', data=json.dumps(login).encode(), headers=headers)
resp=urllib.request.urlopen(req)
body=json.loads(resp.read().decode())
token=body.get('access_token')
print('token len', len(token))
auth={'Authorization':f'Bearer {token}', 'Content-Type':'application/json'}

# Create category
cat = {'name':'TestCat','description':'Category for testing'}
req=urllib.request.Request(url+'/categories', data=json.dumps(cat).encode(), headers=auth)
resp=urllib.request.urlopen(req)
cat_body=json.loads(resp.read().decode())
cat_id=cat_body['id']
print('created category', cat_id)

# Create product
prod = {'name':'TestProduct','description':'test','sku':'TESTSKU001','barcode':'12345','price':10.0,'purchase_price':6.0,'quantity':0,'image':None,'status':'active','category_id':cat_id}
req=urllib.request.Request(url+'/products', data=json.dumps(prod).encode(), headers=auth)
resp=urllib.request.urlopen(req)
prod_body=json.loads(resp.read().decode())
prod_id=prod_body['id']
print('created product', prod_id)

# Create warehouse
wh = {'name':'TestWH','location':'TestLoc','manager':'Me','capacity':1000,'status':'active'}
req=urllib.request.Request(url+'/warehouses', data=json.dumps(wh).encode(), headers=auth)
resp=urllib.request.urlopen(req)
wh_body=json.loads(resp.read().decode())
wh_id=wh_body['id']
print('created warehouse', wh_id)

# Adjust inventory (create inventory record)
adj = {'product_id':prod_id,'warehouse_id':wh_id,'stock':50,'damaged_stock':0,'description':'Initial stock'}
req=urllib.request.Request(url+'/inventory/adjust', data=json.dumps(adj).encode(), headers=auth)
resp=urllib.request.urlopen(req)
print('inventory adjust status', resp.getcode())
print(resp.read().decode())

# Verify inventory via GET /inventory
req=urllib.request.Request(url+'/inventory', headers=auth)
resp=urllib.request.urlopen(req)
print('inventory list', resp.read().decode())
