var app = app || {};
app.auth = {};

app.initApp = function () {

  window.createArkaneProviderEngine('Arketype').then(provider => {
    window.web3 = new Web3(provider);

    app.handleAuthenticated(window.web3);
    app.addConnectEvents();
  });


  //
  // window.arkaneConnect
  //   .checkAuthenticated()
  //   .then((result) => {
  //       $('input[name=redirect]').val(window.location.href);
  //       return result.authenticated(app.handleAuthenticated)
  //         .notAuthenticated((auth) => {
  //           document.body.classList.add('not-logged-in');
  //         });
  //     }
  //   )
  //   .catch(reason => app.log(reason));
  // app.attachLinkEvents();
};

app.handleAuthenticated = (web3) => {
  document.body.classList.add('logged-in');
};

app.checkResultRequestParams = function () {
  const status = this.getQueryParam('status');
  if (status === 'SUCCESS') {
    app.log({status: status, result: app.extractResultFromQueryParams()});
  } else if (status === 'ABORTED') {
    app.log({status, errors: []});
  }
};

app.extractResultFromQueryParams = function () {
  const validResultParams = ['transactionHash', 'signedTransaction', 'r', 's', 'v'];
  const result = {};
  const regex = new RegExp(/[\?|\&]([^=]+)\=([^&]+)/g);
  let requestParam = regex.exec(window.location.href);
  while (requestParam && requestParam !== null) {
    if (validResultParams.includes(requestParam[1])) {
      const asObject = {};
      asObject[decodeURIComponent(requestParam[1])] = decodeURIComponent(requestParam[2]);
      Object.assign(result, asObject);
    }
    requestParam = regex.exec(window.location.href);
  }
  return result;
};

app.addConnectEvents = function () {
  document.getElementById('get-wallets').addEventListener('click', function () {
    window.arkaneConnect.api.getWallets().then(function (e) {
      app.log(e);
      $("#sign-ETHEREUM-form select[name='walletId']").find('option').remove();
      $("#sign-ETHEREUM-RAW-form select[name='walletId']").find('option').remove();
      $("#execute-ETHEREUM-form select[name='walletId']").find('option').remove();
      for (w of e) {
        $(`#sign-${w.secretType}-form select[name='walletId']`).append($('<option>', {
          value: w.id,
          text: w.address
        }));

        $(`#sign-${w.secretType}-RAW-form select[name='walletId']`).append($('<option>', {
          value: w.id,
          text: w.address
        }));

        $(`#execute-${w.secretType}-form select[name='walletId']`).append($('<option>', {
          value: w.id,
          text: w.address
        }));
      }
      $('#sign').show();
      $('#execute').show();
    });
  });

  document.getElementById('manage-eth-wallets').addEventListener('click', function () {
    window.arkaneConnect.manageWallets('ETHEREUM', {redirectUri: 'http://localhost:4000', correlationID: `${Date.now()}`});
  });


  document.getElementById('link-wallets').addEventListener('click', function () {
    window.arkaneConnect.linkWallets({redirectUri: 'http://localhost:4000'});
  });

  document.getElementById('sign-ETHEREUM-form').addEventListener('submit', function (e) {
    e.preventDefault();

    var rawTransaction = {
      "from": $("#sign-ETHEREUM-form select[name='walletId']").text(),
      "to": $("#sign-ETHEREUM-form input[name='to']").val(),
      "value": $("#sign-ETHEREUM-form input[name='value']").val(),
      "gas": 21000
    };

    window.web3.eth.sendTransaction(rawTransaction, (err, result) => {
      if (err) {
        app.log("error: " + err);
      } else {
        app.log(result);
      }
    });
  });

  document.getElementById('sign-ETHEREUM-RAW-form').addEventListener('submit', function (e) {
    e.preventDefault();
    // Sign Ethereum RAW


    window.web3.eth.sign($("#sign-ETHEREUM-RAW-form select[name='walletId']").text(), $("#sign-ETHEREUM-RAW-form textarea[name='data']").val(), (err, result) => {
      if (err) {
        app.log("error: " + err);
      } else {
        app.log(result);
      }
    });
  });
};

app.getWallets = function () {
  window.arkaneConnect.getWallets().then(function (result) {
    app.log(result);
  })
};

app.log = function (txt) {
  if (isObject(txt)) {
    txt = JSON.stringify(txt, null, 2);
  }
  var date = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
  txt = '---' + date + '---\n' + txt;
  $('#appLog').html(txt + '\n\n' + $('#appLog').html());
};

app.getQueryParam = function (name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results == null) {
    return null;
  }
  return decodeURIComponent(results[1]) || 0;
};

function isObject(obj) {
  return obj === Object(obj);
}

app.initApp();