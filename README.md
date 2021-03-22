# Wasabi dashboard
Basic dashboard to monitor the used, deleted and padding storage in [Wasabi Cloud](https://wasabi.com/).
![Screenshot](https://i.imgur.com/N07Ed4y.png)

## Installation and configuration
1. Log into your Wasabi account and create a new policy as the following:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "aws-portal:ViewBilling"
      ],
      "Resource": "*"
    }
  ]
}
```
2. create a new sub-user with console access in Wasabi, and assign to him the policy created at the step 1;
3. enable the option "Allow IAM Users and Roles to access Billing Portal" in Wasabi settings;
4. clone this repository and run `composer install`;
5. create a copy of the file `config.example.php` called `config.php`, and insert your Wasabi root email and the username and password of the user you created at the step 2;
6. (extra) if you have some buckets with long names, you can set an alias for them in `config.php`, and it will be displayed instead of the name when you hover on the charts.

## Disclaimer
WASABI is trademarks of Wasabi Technologies, Inc. This project is not related to Wasabi Technologies, Inc and it's provided without warranty of any kind under the terms of the [MIT License](https://github.com/cristianlivella/wasabi-dashboard/blob/master/LICENSE).
