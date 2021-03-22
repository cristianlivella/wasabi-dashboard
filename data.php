<?php
require 'config.php';
require 'functions.php';
require 'vendor/autoload.php';

// Retrieve access key from json file
if (file_exists('access_key.json')) {
    $accessKey = json_decode(file_get_contents('access_key.json'), true);
}

// If the access key doesn't exist or it's expired, login into Wasabi and get a new access key
if (!isset($accessKey['Expires']) || strtotime($accessKey['Expires']) < time()) {
    $requestBody =  'Action=CreateTemporaryAccessCredentials' .
                    '&SessionName=console-generated-key' .
                    '&Account=' . urlencode(WASABI_ROOT_EMAIL).
                    '&Password=' . urlencode(WASABI_PASSWORD) .
                    '&UserName=' . urlencode(WASABI_USERNAME);
    $loginRes = customCurl('https://iam.wasabisys.com/', [], 'POST', $requestBody);
    $loginRes = simplexml_load_string($loginRes);
    $loginRes = json_decode(json_encode($loginRes), true);

    // Put the new key in the $accessKey array and save it in the json file
    $accessKey = $loginRes['CreateTemporaryAccessCredentialsResult']['AccessKey'];
    file_put_contents("access_key.json", json_encode($accessKey));
}

$s3 = new Aws\S3\S3Client([
	'region'  => 'us-east-1',
    'version' => '2006-03-01',
    'endpoint' => 'https://s3.wasabisys.com/',
	'credentials' => [
	    'key'    => $accessKey['AccessKeyId'],
	    'secret' => $accessKey['SecretAccessKey'],
	]
]);

// Get the bucket list
$buckets = $s3->listBuckets();

$bucketsUtilization = [];
$totalUtilization = ['size' => 0, 'padding' => 0, 'deleted' => 0];

// Foreach bucket, retrieve storage utilization
foreach ($buckets['Buckets'] as $bucket) {
    $name = $bucket['Name'];
    $additionalHeaders = ['x-wasabi-authorization: ' . $accessKey['AccessKeyId'] . ':' . $accessKey['SecretAccessKey']];
    $res = customCurl('https://billing-service.wasabisys.com/v1/bucket/by-name/' . $name . '/utilization', $additionalHeaders);
    $utilization = json_decode($res, true)[0];
    $bucketsUtilization[] = [
        'name' => getBucketName($name),
        'size' => $utilization['PaddedStorageSizeBytes'],
        'padding' => $utilization['PaddedStorageSizeBytes'] - $utilization['RawStorageSizeBytes'],
        'deleted' => $utilization['DeletedStorageSizeBytes']
    ];
    $totalUtilization['size'] += $utilization['PaddedStorageSizeBytes'];
    $totalUtilization['padding'] += $utilization['PaddedStorageSizeBytes'] - $utilization['RawStorageSizeBytes'];
    $totalUtilization['deleted'] += $utilization['DeletedStorageSizeBytes'];
}

echo json_encode([
    'buckets' => $bucketsUtilization,
    'total' => $totalUtilization
]);
