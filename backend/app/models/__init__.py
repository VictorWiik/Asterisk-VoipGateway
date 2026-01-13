from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.models.gateway import Gateway
from app.models.did import DID
from app.models.route import Route
from app.models.extension import Extension
from app.models.tariff import Tariff
from app.models.cdr import CDR
from app.models.plan import Plan, plan_routes

# Importar CustomerDID se existir
try:
    from app.models.did import CustomerDID
except ImportError:
    pass

try:
    from app.models.associations import CustomerDID
except ImportError:
    pass
