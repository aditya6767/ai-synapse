from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from user_manager.models import Account

class SignupSerializer(serializers.ModelSerializer):
    """
    Serializer for user signup. Handles validation including password confirmation.
    """
    # Add password2 field for confirmation (not part of the model)
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True, required=True)

    class Meta:
        model = Account
        # Fields expected from the frontend API call
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'password': {'write_only': True, 'style': {'input_type': 'password'}, 'validators': [validate_password]},
            'email': {'required': True},
            'username': {'required': True},
        }

    def validate(self, attrs):
        """
        Check that the two password entries match.
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password2": "Password fields didn't match."})
        # You can add other cross-field validation here if needed
        return attrs

    def create(self, validated_data):
        """
        Create and return a new user instance, given the validated data.
        Handles password hashing.
        """
        # Use your AccountManager's create_user method
        # Pop password2 as it's not part of the Account model
        validated_data.pop('password2')
        # Extract password separately to pass to create_user
        password = validated_data.pop('password')

        try:
            # Call manager's create_user (ensure it accepts email, username, password)
            user = Account.objects.create_user(
                email=validated_data.get('email'),
                username=validated_data.get('username'),
                password=password,
            )
            return user
        except ValueError as e:
            # Catch potential errors from create_user (like missing fields if manager requires more)
             raise serializers.ValidationError(str(e))


class UserProfileSerializer(serializers.ModelSerializer):
        """
        Serializer for retrieving and updating the user's profile,
        specifically allowing ssh_public_key updates.
        """
        class Meta:
            model = Account
            # Fields to display and potentially update
            fields = ['id', 'username', 'email', 'is_staff', 'ssh_public_key']
            # Prevent users from changing username/email via this profile endpoint
            read_only_fields = ['id', 'username', 'email', 'is_staff']
            # ssh_public_key is writable. DRF respects blank=True, null=True from the model.
            extra_kwargs = {
                'ssh_public_key': {
                    'required': False,      # Not required to submit
                    'allow_blank': True,    # Allow empty string
                    'allow_null': True,     # Allow null value
                    'style': {'base_template': 'textarea.html'} # Suggest textarea rendering in Browsable API
                }
            }