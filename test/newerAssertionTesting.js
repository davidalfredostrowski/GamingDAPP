describe("test game scenario", function(){
  it("test my win loss function", async function(){

          const Game = await ethers.deployContract("Gaming");

          const fundGame = await Game.fundGame({from: signers[0], value web3.utils.toWei('100', 'ether')})

          const signers = await ethers.getSigners();

          const gameRound = await Game.winOrLose(11,true,{ from: signers[0], value: web3.utils.toWei('1', 'ether') } )
          
          const postBalance = await web3.eth.getBalance(player1)
          const postBalanceInEther = Number(web3.utils.fromWei(postBalance, 'ether'))
          const playerStats = await gaming.players(player1)
          assert.equal(playerStats[1].toNumber(), 1, 'The player should have 1 loss')
          assert.isAtLeast(initialBalanceInEther, postBalanceInEther + 1, 'Player account should have decreased by the amount of the wager')


  });
});
