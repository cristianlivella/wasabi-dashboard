<?php
function customCurl($url, $additionalHeaders = [], $method = 'GET', $body = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_ENCODING, 'gzip, deflate');
    $headers = array();
    $headers[] = 'Authority: ' . parse_url($url)['host'];
    $headers[] = 'Dnt: 1';
    $headers[] = 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_7) AppleWebKit/5341 (KHTML, like Gecko) Chrome/39.0.806.0 Mobile Safari/5341';
    $headers[] = 'Content-Type: application/x-www-form-urlencoded';
    $headers[] = 'Accept: application/json, text/plain, */*';
    $headers[] = 'X-Amz-Date: fake';
    $headers[] = 'X-Wasabi-Service: iam';
    $headers[] = 'Sec-Fetch-Site: same-site';
    $headers[] = 'Sec-Fetch-Mode: cors';
    $headers[] = 'Sec-Fetch-Dest: empty';
    $headers[] = 'Accept-Language: en-US,en;q=0.9';
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($headers, $additionalHeaders));
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

function getBucketName($name) {
    if (isset(BUCKETS_ALIASES[$name])) {
        return BUCKETS_ALIASES[$name];
    }
    return $name;
}
