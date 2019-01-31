var app = app || {};
app.auth = {};

app.initApp = () => {
  Arkane.createArkaneProviderEngine('Arketype').then(provider => {
    window.web3 = new Web3(provider);
    document.body.classList.add('logged-in');
    app.addConnectEvents();
  });
};

app.addConnectEvents = () => {
  $('#get-wallets').click(() => {
    window.web3.eth.getAccounts((err, wallets) => {
      app.log('wallets: ' + wallets);
      $("#sign-ETHEREUM-form select[name='walletId']").find('option').remove();
      $("#sign-ETHEREUM-RAW-form select[name='walletId']").find('option').remove();
      $("#execute-ETHEREUM-form select[name='walletId']").find('option').remove();

      wallets.forEach((wallet) => {
        $(`#sign-ETHEREUM-form select[name='walletId']`).append($('<option>', {
          value: wallet,
          text: wallet
        }));

        $(`#sign-ETHEREUM-RAW-form select[name='walletId']`).append($('<option>', {
          value: wallet,
          text: wallet
        }));
      });
      $('#sign').show();
    });
  });

  $('#manage-eth-wallets').click(() => {
    window.arkaneConnect.manageWallets('ETHEREUM', {redirectUri: 'http://localhost:4000', correlationID: `${Date.now()}`});
  });

  $('#link-wallets').click(() => {
    window.arkaneConnect.linkWallets({redirectUri: 'http://localhost:4000'});
  });

  $('#sign-ETHEREUM-form').click((e) => {
    e.preventDefault();

    var rawTransaction = {
      "from": $("#sign-ETHEREUM-form select[name='walletId']").val(),
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

  $('#sign-ETHEREUM-RAW-form').submit((e) => {
    e.preventDefault();

    window.web3.eth.sign($("#sign-ETHEREUM-RAW-form select[name='walletId']").val(), $("#sign-ETHEREUM-RAW-form textarea[name='data']").val(), (err, result) => {
      if (err) {
        app.log("error: " + err);
      } else {
        app.log(result);
      }
    });
  });
};

app.getWallets = () => {
  window.arkaneConnect.getWallets().then((result) => {
    app.log(result);
  })
};

app.log = (txt) => {
  if (isObject(txt)) {
    txt = JSON.stringify(txt, null, 2);
  }
  const date = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
  txt = '---' + date + '---\n' + txt;
  $('#appLog').html(txt + '\n\n' + $('#appLog').html());
};

app.getQueryParam = (name) => {
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