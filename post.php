<?php
// A basic print out of what the form sends to test file transmit
    echo '<p>In a PHP/POST request, the form will send the attached file in one of two possible arrays: $_POST or $_FILES, depending on browser compatability.</p>';
    echo '<p>The $_FILES array will contain the File object generated by the DOM API.</p>';
    echo "<pre>";
    print_r($_FILES);
    echo '</pre>';
    echo '<p>The $_POST array will contain the post text.</p>
        <p>On older browsers that don\'t have native FileReader support, we add an an associative array that is similar to the native DOM File object.</p>';
    echo '<pre>';
    print_r($_POST);
