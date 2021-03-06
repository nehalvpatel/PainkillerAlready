<?php

require_once("../config.php");

$episodes_query = $con->prepare("SELECT * FROM `episodes` ORDER BY `Identifier` ASC");
$episodes_query->execute();			
$episodes_results = $episodes_query->fetchAll();

$timestamps_query = $con->prepare("SELECT DISTINCT `Episode` FROM `timestamps` WHERE `Deleted` = '0'");
$timestamps_query->execute();
$timestamps_results = $timestamps_query->fetchAll();

$timelined_episodes = array();
foreach ($timestamps_results as $timestamp_result) {
    $timelined_episodes[] = $timestamp_result["Episode"];
}

$latest = true;
$output = array();
foreach (array_reverse($episodes_results) as $episode_result) {
    $episode = new Episode($con, $episode_result);

    $episode_data = array();
    $episode_data["Identifier"] = $episode->getIdentifier();
    $episode_data["Number"] = (float)$episode->getNumber();
    $episode_data["DateTime"] = $episode->getDate();
    $episode_data["Date"] = date("F d, Y", strtotime($episode->getDate()));
    $episode_data["YouTube"] = $episode->getYouTube();
    $episode_data["Timelined"] = in_array($episode_data["Identifier"], $timelined_episodes);

    $output["episodes"][$episode_data["Identifier"]] = $episode_data;

    if ($latest) {
        $output["latest"] = array(
            "Identifier" => $episode_data["Identifier"],
            "Number" => $episode_data["Number"]
        );
        $latest = false;
    }
}

if (isset($_SESSION["username"])) {
    $output["loggedIn"] = true;
} else {
    $output["loggedIn"] = false;
}

$output["people"] = array();
foreach ($Podcast->getPeople() as $person) {
    $output["people"][$person->getID()] = array();
}

?><!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="apple-mobile-web-app-title" content="Painkiller Already">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <link rel="search" type="application/opensearchdescription+xml" href="https://www.painkilleralready.com/opensearchdescription.xml" title="Painkiller Already">
        <title>Painkiller Already</title>

        <link rel="apple-touch-icon" sizes="57x57" href="https://www.painkilleralready.com/apple-touch-icon-57x57.png">
        <link rel="apple-touch-icon" sizes="114x114" href="https://www.painkilleralready.com/apple-touch-icon-114x114.png">
        <link rel="apple-touch-icon" sizes="72x72" href="https://www.painkilleralready.com/apple-touch-icon-72x72.png">
        <link rel="apple-touch-icon" sizes="144x144" href="https://www.painkilleralready.com/apple-touch-icon-144x144.png">
        <link rel="apple-touch-icon" sizes="60x60" href="https://www.painkilleralready.com/apple-touch-icon-60x60.png">
        <link rel="apple-touch-icon" sizes="120x120" href="https://www.painkilleralready.com/apple-touch-icon-120x120.png">
        <link rel="apple-touch-icon" sizes="76x76" href="https://www.painkilleralready.com/apple-touch-icon-76x76.png">
        <link rel="apple-touch-icon" sizes="152x152" href="https://www.painkilleralready.com/apple-touch-icon-152x152.png">
        <link rel="icon" sizes="196x196" type="image/png" href="https://www.painkilleralready.com/favicon-196x196.png">
        <link rel="icon" sizes="160x160" type="image/png" href="https://www.painkilleralready.com/favicon-160x160.png">
        <link rel="icon" sizes="96x96" type="image/png" href="https://www.painkilleralready.com/favicon-96x96.png">
        <link rel="icon" sizes="32x32" type="image/png" href="https://www.painkilleralready.com/favicon-32x32.png">
        <link rel="icon" sizes="16x16" type="image/png" href="https://www.painkilleralready.com/favicon-16x16.png">
        <meta name="msapplication-TileColor" content="#ffffff">
        <meta name="msapplication-TileImage" content="https://www.painkilleralready.com/mstile-144x144.png">

        <link rel="publisher" href="https://plus.google.com/107397414095793132493">

        <meta property="og:image" content="https://www.painkilleralready.com/img/pka.png">
		<meta property="og:site_name" content="Painkiller Already">

        <script id="data" type="application/json"><?php echo json_encode($output); ?></script>
        
        <script src="/js/App.js"></script>
        <link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Open+Sans:400,700">
        <link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/font-awesome/3.0.2/css/font-awesome.min.css">
        <script>
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

            ga('create', 'UA-46640110-1', 'auto');
        </script>
    </head>
    <body>
        <div id="app"></div>
	</body>
</html>