<template>
  <div class='content'>
    <div class="battle-box">
      <div class="line left">
        <div class="item">
          <div class='player-box'>
            <player :data="defenseList[0]"></player>
          </div>
        </div>
        <div class="item">
          <div class='player-box'>
            <player :data="defenseList[1]"></player>
          </div>
        </div>
      </div>
      <div class="line left">
        <div class="item">
          <div class='player-box'>
            <player :data="defenseList[2]"></player>
          </div>
        </div>
        <div class="item">
          <div class='player-box'>
            <player :data="defenseList[3]"></player>
          </div>
        </div>
      </div>
      <div class="line">
        <div class="item">
          <div class='player-box'>
            <player :data="defenseList[4]"></player>
          </div>
        </div>
        <i class="mid-icon fa fa-futbol-o" aria-hidden="true"></i>
        <div class="item me">
          <div class='player-box'>
            <player :data="attackList[4]"></player>
          </div>
        </div>
      </div>
      <div class="line right">
        <div class="item me">
          <div class='player-box'>
            <player :data="attackList[3]"></player>
          </div>
        </div>
        <div class="item me">
          <div class='player-box'>
            <player :data="attackList[2]"></player>
          </div>
        </div>
      </div>
      <div class="line right">
        <div class="item me">
          <div class='player-box'>
            <player :data="attackList[1]"></player>
          </div>
        </div>
        <div class="item me">
          <div class='player-box'>
            <player :data="attackList[0]"></player>
          </div>
        </div>
      </div>
    </div>
    <div class="live-box">
      <div v-show='resultList.length<1' class="text-live">{{liveStr}}<i class="fa fa-spinner fa-pulse fa-3x fa-fw" style='margin-top:30px;font-size:36px;'></i></div>
      <div v-show='resultList.length>1' class="text-live">
        <p style='font-size:80px;width:100%;display:flex;justify-content:center;'><span style='width:160px;text-align:center;'>{{resultList[0]}}</span><span style='display:inline-block;width:40px;text-align:center;'>:</span><span style='width:160px;text-align:center;'>{{resultList[1]}}</span></p>
        <p style='font-size:20px;width:100%;display:flex;justify-content:center;'><span style='width:160px;text-align:center;'>我方</span><span style='display:inline-block;width:40px;text-align:center;'></span><span style='width:160px;text-align:center;'>敌方</span></p>
        <p v-show='winFlag' class='win-box'>获胜!</p>
        <p v-show='!winFlag' class='lose-box'>失败</p>
        <p class="bottom-btn hand" @click='challenge'>再次挑战</p>
      </div>
    </div>
  </div>
</template>

<script>
import player from "../components/miniPlayer";
import handleStr from "./handleStr";

export default {
  components: {
    player
  },
  data() {
    return {
      defenseList: this.$route.query.team,
      address: this.$route.query.address,
      liveStr: "激烈角逐中",
      resultList: [],
      winFlag: false,
      noPower: false,
    };
  },
  computed: {
    attackList() {
      const team = this.getItem("teamList");
      const map = this.getItem("playerMap") || {};
      return team.map(cid => {
        return map[cid];
      });
    }
  },
  methods: {
    async handlePowerTip() {
      let power = await this.$simulateCall(0, "get_user_power", "");
      power = +power;
      if (isNaN(power)) power = "??";
      this.$store.commit({
        type: "update",
        power
      });
      if (power <= 0) {
        this.$message({
          type: "error",
          showClose: true,
          duration: 0,
          message: "您的体力值不足!"
        });
        this.noPower = true
      }
    },
    async challenge() {
      this.handlePowerTip()
      this.init();
      this.initMe();
      this.resultList = [];
      const self = this;
      let callArgs = `["${this.address}"]`;
      let result = null;
      let match_id = await this.$simulateCall(0, "get_matchMap_cnt", "");
      await this.$call(0, "team_vs", callArgs);

      function getResult() {
        setTimeout(async () => {
          result = await self.$simulateCall(
            0,
            "get_match_info",
            `["${match_id}"]`
          );
          if(self.noPower) return
          if (result == "null" || !result) {
            getResult();
          } else {
            let resultback = result.split("_");

            let [addr1, addr2, myScore, enemyScore, grow] = resultback;
            grow = parseFloat(grow);
            self.resultList = [myScore, enemyScore];
            if (+grow > 0) {
              self.winFlag = true;
              self.$message({
                type: "success",
                showClose: true,
                duration: 0,
                message: "挑战成功! 球员属性获得了提升!"
              });
            } else {
              self.winFlag = false;
              self.$message({
                type: "error",
                showClose: true,
                duration: 0,
                message: "挑战失败!"
              });
            }
          }
        }, 500);
      }

      getResult();
    },
    getPlayerByCardId(cardId, playerList) {
      for (let i = 0; i < playerList.length; i++) {
        let p = playerList[i];
        if (p.cardId == cardId) return p;
      }
      return null;
    },
    async init() {
      const team = this.defenseList;
      for (let j = 0; j < team.length; j++) {
        let member_j = {};
        const cardId = team[j].cardId;
        let callArgs_m = `["${cardId}"]`;
        let member = await this.$simulateCall(0, "get_card_id", callArgs_m);
        if (this.pageChange != this.initDetailCount) return; // init次数与翻页次数不同，则退出
        let member_num = member.replace(/\"/g, "").split(",");
        member_j["cardId"] = cardId;
        member_j["avatorId"] = member_num[0];
        member_j["player_name"] = member_num[1];
        member_j["shoot"] = member_num[2];
        member_j["defend"] = member_num[3];
        member_j["speed"] = member_num[4];
        member_j["shoot_factor"] = member_num[5];
        member_j["defend_factor"] = member_num[6];
        member_j["speed_factor"] = member_num[7];
        member_j["position"] = member_num[8];
        member_j["growth"] = member_num[9];
        member_j["avator"] = `${this.$preUrl}${member_j["avatorId"]}.jpg`;
        this.handlePlayerStorage(member_j, "attack"); // 缓存球员头像
        this.$set(this.defenseList, j, member_j);
      }
    },
    async initMe() {
      const team = this.attackList;
      for (let j = 0; j < team.length; j++) {
        let member_j = {};
        const cardId = team[j].cardId;
        let callArgs_m = `["${cardId}"]`;
        let member = await this.$simulateCall(0, "get_card_id", callArgs_m);
        if (this.pageChange != this.initDetailCount) return; // init次数与翻页次数不同，则退出
        let member_num = member.replace(/\"/g, "").split(",");
        member_j["cardId"] = cardId;
        member_j["avatorId"] = member_num[0];
        member_j["player_name"] = member_num[1];
        member_j["shoot"] = member_num[2];
        member_j["defend"] = member_num[3];
        member_j["speed"] = member_num[4];
        member_j["shoot_factor"] = member_num[5];
        member_j["defend_factor"] = member_num[6];
        member_j["speed_factor"] = member_num[7];
        member_j["position"] = member_num[8];
        member_j["growth"] = member_num[9];
        member_j["avator"] = `${this.$preUrl}${member_j["avatorId"]}.jpg`;
        this.handlePlayerStorage(member_j, "attack"); // 缓存球员头像
        this.$set(this.attackList, j, member_j);
      }
    }
  },
  async created() {
    this.challenge();
  }
};
</script>

<style lang='scss' scoped>
.content {
  position: relative;
  display: flex;
  align-items: flex-start;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 20px;
  .battle-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
    height: 100%;
    .line {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      &.left {
        justify-content: flex-start;
      }
      &.right {
        justify-content: flex-end;
      }
    }
    .item {
      display: flex;
      justify-content: center;
      text-align: center;
      margin-right: 20px;
      background-color: rgba(233, 23, 32, 0.7);
      border-radius: 10px;
      position: relative;
      overflow: hidden;
      &.me {
        background-color: rgba(255, 215, 3, 0.7);
      }
      .player-box {
      }
    }
  }
  .live-box {
    width: 50%;
    height: 300px;
    display: flex;
    position: absolute;
    left: 40px;
    bottom: 40px;
    flex-direction: column;
    align-items: center;
    padding: 20px;

    .bottom-btn {
      position: absolute;
      bottom: -30px;
      background-color: rgb(236, 185, 30);
      width: 200px;
      height: 40px;
      line-height: 40px;
      text-align: center;
      color: #fff;
      border-radius: 20px;
    }
    .text-live {
      width: 100%;
      font-size: 22px;
      height: 700px;
      padding: 10px;
      background-color: rgba(255, 255, 255, 0.8);
      white-space: pre-wrap;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .win-box {
      color: #e91720;
      line-height: 40px;
      margin-top: 20px;
      font-size: 30px;
    }
    .lose-box {
      color: #3cac54;
      line-height: 40px;
      margin-top: 20px;
      font-size: 30px;
    }
    .skip-btn {
      width: 80%;
      margin-top: 40px;
      color: #fff;
      font-size: 20px;
      background-color: #3cac54;
      border-color: #3cac54;
      border-radius: 60px;
    }
  }
}
.mid-icon {
  font-size: 100px;
  color: #aaa;
  margin-right: 20px;
}
</style>
