export default `
body {
    padding: 0;
    margin: 0;
}
    
table {
    padding: 15px;
    display: flex;
    flex-direction: column;
    background-image: url('https://sun9-50.userapi.com/impf/c836234/v836234928/5492b/ytOG4LZA8uA.jpg?size=2000x1651&quality=96&sign=5aaeb47699a9224e06a1a575829afd91&type=album');
    background-size: 100%;
}
    
img {
    width: 60px;
    border-radius: 6px;
}

.tapped {
    transform: rotate(90deg)
}
    
tr {
    /*border: 1px solid red;*/
    display: flex
}

tr:nth-child(3) {
    margin-bottom: 5px;
}

td:first-child {
    margin-right: 25px;
}

td:last-child {
    margin-left: 25px;
}
    
td {
    width: 203px;
    height: 100px;
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-wrapper {
    position: relative;
}

.counter {
    width: 15px;
    height: 15px;
    position: absolute;
    z-index: 200;
    border-radius: 100px;
    font-size: 12px;
    font-style: bold;
    top: 52%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.life-counter {
    background-color: red;
    color: white;
    left: 2%;
}

.walk-counter {
    background-color: rgb(105, 18, 18);
    color: white;
    left: 23%;
}

.hit-counter {
    width: 30px;
    height: 15px;
    background-color: rgb(30, 182, 25);
    color: white;
    right: 2%;
}

/*

.protects {
    position: absolute;
    top: 20%
}

*/
`