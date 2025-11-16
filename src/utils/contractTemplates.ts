// Plantillas de contratos inteligentes para Polkadot
// Cumple con las reglas del hackathon: Solidity ^0.8.28, testnet Pop Network

/**
 * Sanitiza un nombre de contrato para que sea válido en Solidity
 * Solidity identifiers deben:
 * - Empezar con letra o underscore
 * - Contener solo letras, números, underscores
 * - No tener espacios ni caracteres especiales
 */
export const sanitizeContractName = (name: string): string => {
  // Reemplazar espacios con underscores
  let sanitized = name.replace(/\s+/g, '_')

  // Remover caracteres especiales, mantener solo alphanumerics y underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '')

  // Si está vacío después de sanitizar, usar nombre por defecto
  if (!sanitized) {
    return 'SmartContract'
  }

  // Si empieza con número, agregar prefijo
  if (/^\d/.test(sanitized)) {
    sanitized = '_' + sanitized
  }

  // Limitar a 63 caracteres (límite razonable de Solidity)
  if (sanitized.length > 63) {
    sanitized = sanitized.slice(0, 63)
  }

  return sanitized
}

export interface ContractConfig {
  name: string
  symbol?: string
  decimals?: number
  initialSupply?: number
  votingDuration?: number
  platformFee?: number
  [key: string]: any
}

/**
 * Genera un contrato Token (ERC20) dinámicamente
 */
export const generateTokenContract = (config: ContractConfig): string => {
  const { name, symbol = 'TKN', decimals = 18, initialSupply = 1000000 } = config
  const sanitizedName = sanitizeContractName(name)

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${sanitizedName} {
    string public name = "${name}";
    string public symbol = "${symbol}";
    uint8 public decimals = ${decimals};
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        totalSupply = ${initialSupply} * 10**${decimals};
        balanceOf[msg.sender] = totalSupply;
        owner = msg.sender;

        emit Transfer(address(0), msg.sender, totalSupply);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Saldo insuficiente");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Saldo insuficiente");
        require(allowance[from][msg.sender] >= amount, "Permiso insuficiente");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;

        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Saldo insuficiente");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}`
}

/**
 * Genera un contrato NFT (ERC721) dinámicamente
 */
export const generateNFTContract = (config: ContractConfig): string => {
  const { name, symbol = 'NFT' } = config
  const sanitizedName = sanitizeContractName(name)

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${sanitizedName} {
    string public name = "${name}";
    string public symbol = "${symbol}";
    uint256 public nextTokenId = 1;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => string) public tokenURI;
    mapping(uint256 => address) public approved;

    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event Mint(address indexed to, uint256 indexed tokenId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }

    function mint(address to, string memory _tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId++;
        ownerOf[tokenId] = to;
        balanceOf[to]++;
        tokenURI[tokenId] = _tokenURI;

        emit Transfer(address(0), to, tokenId);
        emit Mint(to, tokenId);

        return tokenId;
    }

    function transfer(address to, uint256 tokenId) public {
        require(ownerOf[tokenId] == msg.sender, "No eres el propietario");
        ownerOf[tokenId] = to;
        balanceOf[msg.sender]--;
        balanceOf[to]++;

        emit Transfer(msg.sender, to, tokenId);
    }

    function approve(address to, uint256 tokenId) public {
        require(ownerOf[tokenId] == msg.sender, "No eres el propietario");
        approved[tokenId] = to;
        emit Approval(msg.sender, to, tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(ownerOf[tokenId] == msg.sender, "No eres el propietario");
        tokenURI[tokenId] = _tokenURI;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}`
}

/**
 * Genera un contrato de Gobernanza dinámicamente
 */
export const generateGovernanceContract = (config: ContractConfig): string => {
  const { name, votingDuration = 604800 } = config
  const sanitizedName = sanitizeContractName(name)

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${sanitizedName} {
    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        address proposer;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public isMember;

    uint256 public nextProposalId;
    uint256 public votingDuration = ${votingDuration};
    address public owner;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor() {
        owner = msg.sender;
        isMember[msg.sender] = true;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "No eres miembro");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }

    function addMember(address member) public onlyOwner {
        isMember[member] = true;
    }

    function removeMember(address member) public onlyOwner {
        isMember[member] = false;
    }

    function createProposal(string memory description) public onlyMember returns (uint256) {
        uint256 proposalId = nextProposalId++;
        proposals[proposalId] = Proposal({
            description: description,
            yesVotes: 0,
            noVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingDuration,
            executed: false,
            proposer: msg.sender
        });

        emit ProposalCreated(proposalId, msg.sender);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) public onlyMember {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.endTime, "Votacion cerrada");
        require(!hasVoted[proposalId][msg.sender], "Ya votaste");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit VoteCast(proposalId, msg.sender, support);
    }

    function executeProposal(uint256 proposalId) public onlyMember {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Votacion aun abierta");
        require(!proposal.executed, "Propuesta ya ejecutada");
        require(proposal.yesVotes > proposal.noVotes, "Propuesta rechazada");

        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}`
}

/**
 * Genera un contrato Marketplace dinámicamente
 */
export const generateMarketplaceContract = (config: ContractConfig): string => {
  const { name, platformFee = 250 } = config
  const sanitizedName = sanitizeContractName(name)

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${sanitizedName} {
    struct Item {
        uint256 id;
        address seller;
        uint256 price;
        bool isActive;
        string metadata;
    }

    mapping(uint256 => Item) public items;
    mapping(address => uint256[]) public userItems;

    uint256 public nextItemId;
    address public owner;
    uint256 public platformFee = ${platformFee};

    event ItemListed(uint256 indexed itemId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed itemId, address indexed buyer, uint256 price);
    event ItemDelisted(uint256 indexed itemId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }

    function listItem(uint256 price, string memory metadata) public returns (uint256) {
        require(price > 0, "Precio debe ser mayor a 0");

        uint256 itemId = nextItemId++;
        items[itemId] = Item({
            id: itemId,
            seller: msg.sender,
            price: price,
            isActive: true,
            metadata: metadata
        });

        userItems[msg.sender].push(itemId);

        emit ItemListed(itemId, msg.sender, price);
        return itemId;
    }

    function buyItem(uint256 itemId) public payable {
        Item storage item = items[itemId];
        require(item.isActive, "Item no disponible");
        require(msg.value >= item.price, "Pago insuficiente");
        require(msg.sender != item.seller, "No puedes comprar tu propio item");

        item.isActive = false;

        uint256 fee = (item.price * platformFee) / 10000;
        uint256 sellerAmount = item.price - fee;

        payable(item.seller).transfer(sellerAmount);
        if (fee > 0) {
            payable(owner).transfer(fee);
        }

        if (msg.value > item.price) {
            payable(msg.sender).transfer(msg.value - item.price);
        }

        emit ItemSold(itemId, msg.sender, item.price);
    }

    function delistItem(uint256 itemId) public {
        Item storage item = items[itemId];
        require(item.seller == msg.sender, "No eres el vendedor");
        require(item.isActive, "Item ya no esta activo");

        item.isActive = false;
        emit ItemDelisted(itemId);
    }

    function updatePlatformFee(uint256 newFee) public onlyOwner {
        require(newFee <= 1000, "Fee no puede ser mayor al 10%");
        platformFee = newFee;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}`
}

/**
 * Genera un contrato de Escrow dinámicamente
 */
export const generateEscrowContract = (config: ContractConfig): string => {
  const { name } = config
  const sanitizedName = sanitizeContractName(name)

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${sanitizedName} {
    struct Escrow {
        address buyer;
        address seller;
        address arbiter;
        uint256 amount;
        bool released;
        bool refunded;
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public escrowCounter;
    address public owner;

    event EscrowCreated(uint256 indexed escrowId, address buyer, address seller);
    event FundsReleased(uint256 indexed escrowId);
    event FundsRefunded(uint256 indexed escrowId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }

    function createEscrow(address seller, address arbiter) public payable returns (uint256) {
        require(msg.value > 0, "Cantidad debe ser mayor a 0");
        require(seller != msg.sender, "No puedes ser vendedor y comprador");

        uint256 escrowId = escrowCounter++;
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            arbiter: arbiter,
            amount: msg.value,
            released: false,
            refunded: false
        });

        emit EscrowCreated(escrowId, msg.sender, seller);
        return escrowId;
    }

    function releaseFunds(uint256 escrowId) public {
        Escrow storage escrow = escrows[escrowId];
        require(msg.sender == escrow.buyer || msg.sender == escrow.arbiter, "No autorizado");
        require(!escrow.released && !escrow.refunded, "Escrow ya procesado");

        escrow.released = true;
        payable(escrow.seller).transfer(escrow.amount);

        emit FundsReleased(escrowId);
    }

    function refundFunds(uint256 escrowId) public {
        Escrow storage escrow = escrows[escrowId];
        require(msg.sender == escrow.seller || msg.sender == escrow.arbiter, "No autorizado");
        require(!escrow.released && !escrow.refunded, "Escrow ya procesado");

        escrow.refunded = true;
        payable(escrow.buyer).transfer(escrow.amount);

        emit FundsRefunded(escrowId);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}`
}

/**
 * Genera un contrato de Staking dinámicamente
 */
export const generateStakingContract = (config: ContractConfig): string => {
  const { name } = config
  const sanitizedName = sanitizeContractName(name)

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${sanitizedName} {
    struct Stakeholder {
        uint256 stakedAmount;
        uint256 stakingStartTime;
        uint256 rewardsEarned;
    }

    mapping(address => Stakeholder) public stakeholders;
    uint256 public totalStaked;
    uint256 public rewardRate = 10;
    address public owner;

    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }

    function stake() public payable {
        require(msg.value > 0, "Cantidad debe ser mayor a 0");

        Stakeholder storage stakeholder = stakeholders[msg.sender];
        stakeholder.stakedAmount += msg.value;
        stakeholder.stakingStartTime = block.timestamp;
        totalStaked += msg.value;

        emit Staked(msg.sender, msg.value);
    }

    function unstake(uint256 amount) public {
        Stakeholder storage stakeholder = stakeholders[msg.sender];
        require(stakeholder.stakedAmount >= amount, "Cantidad insuficiente");

        stakeholder.stakedAmount -= amount;
        totalStaked -= amount;

        payable(msg.sender).transfer(amount);
        emit Unstaked(msg.sender, amount);
    }

    function calculateRewards(address staker) public view returns (uint256) {
        Stakeholder memory stakeholder = stakeholders[staker];
        if (stakeholder.stakedAmount == 0) return 0;

        uint256 stakingDuration = block.timestamp - stakeholder.stakingStartTime;
        uint256 rewards = (stakeholder.stakedAmount * rewardRate * stakingDuration) / (100 * 365 days);
        return rewards;
    }

    function claimRewards() public {
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No hay recompensas disponibles");

        stakeholders[msg.sender].rewardsEarned += rewards;
        stakeholders[msg.sender].stakingStartTime = block.timestamp;

        payable(msg.sender).transfer(rewards);
        emit RewardsClaimed(msg.sender, rewards);
    }

    function setRewardRate(uint256 newRate) public onlyOwner {
        rewardRate = newRate;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}`
}

/**
 * Mapeo de tipos de plantillas a sus generadores
 */
const generatorMap = {
  'token-erc20': generateTokenContract,
  'nft-collection': generateNFTContract,
  'governance-dao': generateGovernanceContract,
  'marketplace': generateMarketplaceContract,
  'escrow-contract': generateEscrowContract,
  'staking-pool': generateStakingContract,
}

/**
 * Genera un contrato basado en el tipo y configuración
 */
export const generateContractByType = (templateType: string, config: ContractConfig): string => {
  const generator = generatorMap[templateType as keyof typeof generatorMap]

  if (!generator) {
    // Si no hay generador específico, retornar contrato básico
    return generateBasicContract(config)
  }

  return generator(config)
}

/**
 * Genera un contrato básico como fallback
 */
export const generateBasicContract = (config: ContractConfig): string => {
  const { name } = config
  const sanitizedName = sanitizeContractName(name)

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${sanitizedName} {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}`
}
