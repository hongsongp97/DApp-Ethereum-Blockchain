import React, { Component } from 'react';
import lottery from './lottery';
import web3 from './web3';

function Item(props) {
  return <li>{props.message}</li>;
}

class App extends Component {
  state = {
    manager: '',
    user: '',
    players: [],
    balance: '',
    value: '',
    message: ''
  }

  async componentDidMount() {
    const manager = await lottery.methods.manager().call();
    const players = await lottery.methods.getPlayers().call();
    const balance = await web3.eth.getBalance(lottery.options.address);

    const accounts = await web3.eth.getAccounts();
    const user = accounts[0];


    this.setState({
      manager,
      user,
      players,
      balance
    });
  }

  onSubmit = async event => {
    event.preventDefault();

    const accounts = await web3.eth.getAccounts();

    this.setState({
      message: 'Please wait for the transaction to go through ...'
    });

    await lottery.methods.enter().send({
      from: accounts[0],
      gasPrice: web3.utils.toWei('50', 'Gwei'),
      value: web3.utils.toWei(this.state.value, 'ether')
    });

    this.setState({
      message: 'You have been entered!'
    });

    this.componentDidMount();
  }

  onClick = async () => {
    const accounts = await web3.eth.getAccounts();

    this.setState({
      message: 'Please wait for the transaction to go through ...'
    });

    await lottery.methods.pickWinner().send({
      from: accounts[0],
      gasPrice: web3.utils.toWei('50', 'Gwei')
    });

    const lastWinner = await lottery.methods.lastWinner().call();

    this.setState({
      message: 'A winner has been picked! The winner is ' + lastWinner
    });

    this.componentDidMount();
  }



  render() {
    return (
      <div>
        <h2>Lottery Contract!</h2>
        <p>
          This contract is managed by account: {this.state.manager}. <br />
          There are currently {this.state.players.length} people entered
          competing to win {web3.utils.fromWei(this.state.balance, 'ether')} ether! <br />
          There are: <br />
          <ul>
            {this.state.players.map((message) => <Item key={message} message={message} />)}
          </ul>
        </p>
        <hr />

        <form onSubmit={this.onSubmit}>
          <h4>Want to try your luck?</h4>
          <p>Your account: <b>{this.state.user}</b></p>
          <div>
            <label>Amount of ether to enter </label>
            <input
              value={this.state.value}
              onChange={event => this.setState({ value: event.target.value })}
            />
            <button>Enter</button>
          </div>
        </form>
        <hr />

        <h4>Ready to pick a winner? <i>- Only by manager</i></h4>
        <button onClick={this.onClick}>Pick a winner</button>
        <h1>{this.state.message}</h1>
      </div>
    );
  }
}

export default App;