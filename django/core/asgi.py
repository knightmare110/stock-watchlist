# import os
# from django.core.asgi import get_asgi_application
# from channels.routing import ProtocolTypeRouter, URLRouter
# from django.urls import path
# from websocket.consumers import MyConsumer  # Example consumer

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_app.settings')

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": URLRouter([
#         path("ws/my-path/", MyConsumer.as_asgi()),
#     ]),
# })
