from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.models.gateway_group import GatewayGroup
from app.models.gateway import Gateway
from app.models.did import DID
from app.models.route import Route
from app.models.extension import Extension
from app.models.tariff import Tariff
from app.models.cdr import CDR
from app.models.route_plan import RoutePlan, route_plan_routes
from app.models.tariff_plan import TariffPlan, tariff_plan_tariffs

# Importar associações se existirem
try:
    from app.models.associations import CustomerDID, CustomerRoute
except ImportError:
    pass
