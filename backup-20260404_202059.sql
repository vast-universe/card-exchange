PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_init.sql','2026-04-01 07:49:32');
INSERT INTO "d1_migrations" VALUES(2,'0002_auth_rate_limits.sql','2026-04-01 07:49:32');
INSERT INTO "d1_migrations" VALUES(3,'0003_card_plain_code.sql','2026-04-01 07:49:32');
INSERT INTO "d1_migrations" VALUES(4,'0004_account_types.sql','2026-04-01 09:04:28');
INSERT INTO "d1_migrations" VALUES(5,'0005_card_warranty.sql','2026-04-01 16:06:06');
INSERT INTO "d1_migrations" VALUES(6,'0006_card_delivery_api.sql','2026-04-01 18:21:30');
INSERT INTO "d1_migrations" VALUES(7,'0002_multi_account_cards.sql','2026-04-04 07:18:29');
INSERT INTO "d1_migrations" VALUES(8,'0007_performance_indexes.sql','2026-04-04 07:18:29');
INSERT INTO "d1_migrations" VALUES(9,'verify-0002.sql','2026-04-04 07:18:29');
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pool_code TEXT NOT NULL,
  payload_raw TEXT NOT NULL,
  stock_status TEXT NOT NULL DEFAULT 'available'
    CHECK (stock_status IN ('available', 'bound', 'disabled')),
  check_status TEXT NOT NULL DEFAULT 'ok'
    CHECK (check_status IN ('ok', 'banned', 'unknown')),
  created_at TEXT NOT NULL
);
INSERT INTO "accounts" VALUES(1,'test-type','{"username":"test1","password":"pass1"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(2,'test-type','{"username":"test2","password":"pass2"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(3,'test-type','{"username":"test3","password":"pass3"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(4,'test-type','{"username":"test4","password":"pass4"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(5,'test-type','{"username":"test5","password":"pass5"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(6,'test-type','{"username":"test6","password":"pass6"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(7,'test-type','{"username":"test7","password":"pass7"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(8,'test-type','{"username":"test8","password":"pass8"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(9,'test-type','{"username":"test9","password":"pass9"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(10,'test-type','{"username":"test10","password":"pass10"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(11,'test-type','{"username":"test11","password":"pass11"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(12,'test-type','{"username":"test12","password":"pass12"}','bound','ok','2026-04-04 08:09:47');
INSERT INTO "accounts" VALUES(13,'test-type','{"username":"test13","password":"pass13"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(14,'test-type','{"username":"test14","password":"pass14"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(15,'test-type','{"username":"test15","password":"pass15"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(16,'test-type','{"username":"test16","password":"pass16"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(17,'test-type','{"username":"test17","password":"pass17"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(18,'test-type','{"username":"test18","password":"pass18"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(19,'test-type','{"username":"test19","password":"pass19"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(20,'test-type','{"username":"test20","password":"pass20"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(21,'test-type','{"username":"test21","password":"pass21"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(22,'test-type','{"username":"test22","password":"pass22"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(23,'test-type','{"username":"test23","password":"pass23"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(24,'test-type','{"username":"test24","password":"pass24"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(25,'test-type','{"username":"test25","password":"pass25"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(26,'test-type','{"username":"test26","password":"pass26"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(27,'test-type','{"username":"test27","password":"pass27"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(28,'test-type','{"username":"test28","password":"pass28"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(29,'test-type','{"username":"test29","password":"pass29"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(30,'test-type','{"username":"test30","password":"pass30"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(31,'test-type','{"username":"test31","password":"pass31"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(32,'test-type','{"username":"test32","password":"pass32"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(33,'test-type','{"username":"test33","password":"pass33"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(34,'test-type','{"username":"test34","password":"pass34"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(35,'test-type','{"username":"test35","password":"pass35"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(36,'test-type','{"username":"test36","password":"pass36"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(37,'test-type','{"username":"test37","password":"pass37"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(38,'test-type','{"username":"test38","password":"pass38"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(39,'test-type','{"username":"test39","password":"pass39"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(40,'test-type','{"username":"test40","password":"pass40"}','bound','ok','2026-04-04 09:21:03');
INSERT INTO "accounts" VALUES(41,'test-type','{"username":"test100","password":"pass100"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(42,'test-type','{"username":"test101","password":"pass101"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(43,'test-type','{"username":"test102","password":"pass102"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(44,'test-type','{"username":"test103","password":"pass103"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(45,'test-type','{"username":"test104","password":"pass104"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(46,'test-type','{"username":"test105","password":"pass105"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(47,'test-type','{"username":"test106","password":"pass106"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(48,'test-type','{"username":"test107","password":"pass107"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(49,'test-type','{"username":"test108","password":"pass108"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(50,'test-type','{"username":"test109","password":"pass109"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(51,'test-type','{"username":"test110","password":"pass110"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(52,'test-type','{"username":"test111","password":"pass111"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(53,'test-type','{"username":"test112","password":"pass112"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(54,'test-type','{"username":"test113","password":"pass113"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(55,'test-type','{"username":"test114","password":"pass114"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(56,'test-type','{"username":"test115","password":"pass115"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(57,'test-type','{"username":"test116","password":"pass116"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(58,'test-type','{"username":"test117","password":"pass117"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(59,'test-type','{"username":"test118","password":"pass118"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(60,'test-type','{"username":"test119","password":"pass119"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(61,'test-type','{"username":"test120","password":"pass120"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(62,'test-type','{"username":"test121","password":"pass121"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(63,'test-type','{"username":"test122","password":"pass122"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(64,'test-type','{"username":"test123","password":"pass123"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(65,'test-type','{"username":"test124","password":"pass124"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(66,'test-type','{"username":"test125","password":"pass125"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(67,'test-type','{"username":"test126","password":"pass126"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(68,'test-type','{"username":"test127","password":"pass127"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(69,'test-type','{"username":"test128","password":"pass128"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(70,'test-type','{"username":"test129","password":"pass129"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(71,'test-type','{"username":"test130","password":"pass130"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(72,'test-type','{"username":"test131","password":"pass131"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(73,'test-type','{"username":"test132","password":"pass132"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(74,'test-type','{"username":"test133","password":"pass133"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(75,'test-type','{"username":"test134","password":"pass134"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(76,'test-type','{"username":"test135","password":"pass135"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(77,'test-type','{"username":"test136","password":"pass136"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(78,'test-type','{"username":"test137","password":"pass137"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(79,'test-type','{"username":"test138","password":"pass138"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(80,'test-type','{"username":"test139","password":"pass139"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(81,'test-type','{"username":"test140","password":"pass140"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(82,'test-type','{"username":"test141","password":"pass141"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(83,'test-type','{"username":"test142","password":"pass142"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(84,'test-type','{"username":"test143","password":"pass143"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(85,'test-type','{"username":"test144","password":"pass144"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(86,'test-type','{"username":"test145","password":"pass145"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(87,'test-type','{"username":"test146","password":"pass146"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(88,'test-type','{"username":"test147","password":"pass147"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(89,'test-type','{"username":"test148","password":"pass148"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(90,'test-type','{"username":"test149","password":"pass149"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(91,'test-type','{"username":"test150","password":"pass150"}','bound','ok','2026-04-04 09:47:14');
INSERT INTO "accounts" VALUES(92,'test-type','{"username":"test200","password":"pass200"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(93,'test-type','{"username":"test201","password":"pass201"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(94,'test-type','{"username":"test202","password":"pass202"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(95,'test-type','{"username":"test203","password":"pass203"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(96,'test-type','{"username":"test204","password":"pass204"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(97,'test-type','{"username":"test205","password":"pass205"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(98,'test-type','{"username":"test206","password":"pass206"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(99,'test-type','{"username":"test207","password":"pass207"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(100,'test-type','{"username":"test208","password":"pass208"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(101,'test-type','{"username":"test209","password":"pass209"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(102,'test-type','{"username":"test210","password":"pass210"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(103,'test-type','{"username":"test211","password":"pass211"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(104,'test-type','{"username":"test212","password":"pass212"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(105,'test-type','{"username":"test213","password":"pass213"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(106,'test-type','{"username":"test214","password":"pass214"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(107,'test-type','{"username":"test215","password":"pass215"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(108,'test-type','{"username":"test216","password":"pass216"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(109,'test-type','{"username":"test217","password":"pass217"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(110,'test-type','{"username":"test218","password":"pass218"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(111,'test-type','{"username":"test219","password":"pass219"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(112,'test-type','{"username":"test220","password":"pass220"}','bound','banned','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(113,'test-type','{"username":"test221","password":"pass221"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(114,'test-type','{"username":"test222","password":"pass222"}','bound','banned','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(115,'test-type','{"username":"test223","password":"pass223"}','bound','banned','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(116,'test-type','{"username":"test224","password":"pass224"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(117,'test-type','{"username":"test225","password":"pass225"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(118,'test-type','{"username":"test226","password":"pass226"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(119,'test-type','{"username":"test227","password":"pass227"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(120,'test-type','{"username":"test228","password":"pass228"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(121,'test-type','{"username":"test229","password":"pass229"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(122,'test-type','{"username":"test230","password":"pass230"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(123,'test-type','{"username":"test231","password":"pass231"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(124,'test-type','{"username":"test232","password":"pass232"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(125,'test-type','{"username":"test233","password":"pass233"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(126,'test-type','{"username":"test234","password":"pass234"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(127,'test-type','{"username":"test235","password":"pass235"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(128,'test-type','{"username":"test236","password":"pass236"}','bound','banned','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(129,'test-type','{"username":"test237","password":"pass237"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(130,'test-type','{"username":"test238","password":"pass238"}','bound','banned','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(131,'test-type','{"username":"test239","password":"pass239"}','bound','banned','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(132,'test-type','{"username":"test240","password":"pass240"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(133,'test-type','{"username":"test241","password":"pass241"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(134,'test-type','{"username":"test242","password":"pass242"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(135,'test-type','{"username":"test243","password":"pass243"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(136,'test-type','{"username":"test244","password":"pass244"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(137,'test-type','{"username":"test245","password":"pass245"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(138,'test-type','{"username":"test246","password":"pass246"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(139,'test-type','{"username":"test247","password":"pass247"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(140,'test-type','{"username":"test248","password":"pass248"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(141,'test-type','{"username":"test249","password":"pass249"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(142,'test-type','{"username":"test250","password":"pass250"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(143,'test-type','{"username":"test251","password":"pass251"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(144,'test-type','{"username":"test252","password":"pass252"}','bound','banned','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(145,'test-type','{"username":"test253","password":"pass253"}','bound','ok','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(146,'test-type','{"username":"test254","password":"pass254"}','bound','banned','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(147,'test-type','{"username":"test255","password":"pass255"}','bound','banned','2026-04-04 10:06:06');
INSERT INTO "accounts" VALUES(148,'test-type','{"username":"test256","password":"pass256"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(149,'test-type','{"username":"test257","password":"pass257"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(150,'test-type','{"username":"test258","password":"pass258"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(151,'test-type','{"username":"test259","password":"pass259"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(152,'test-type','{"username":"test260","password":"pass260"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(153,'test-type','{"username":"test261","password":"pass261"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(154,'test-type','{"username":"test262","password":"pass262"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(155,'test-type','{"username":"test263","password":"pass263"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(156,'test-type','{"username":"test264","password":"pass264"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(157,'test-type','{"username":"test265","password":"pass265"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(158,'test-type','{"username":"test266","password":"pass266"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(159,'test-type','{"username":"test267","password":"pass267"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(160,'test-type','{"username":"test268","password":"pass268"}','bound','banned','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(161,'test-type','{"username":"test269","password":"pass269"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(162,'test-type','{"username":"test270","password":"pass270"}','disabled','banned','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(163,'test-type','{"username":"test271","password":"pass271"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(164,'test-type','{"username":"test272","password":"pass272"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(165,'test-type','{"username":"test273","password":"pass273"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(166,'test-type','{"username":"test274","password":"pass274"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(167,'test-type','{"username":"test275","password":"pass275"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(168,'test-type','{"username":"test276","password":"pass276"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(169,'test-type','{"username":"test277","password":"pass277"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(170,'test-type','{"username":"test278","password":"pass278"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(171,'test-type','{"username":"test279","password":"pass279"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(172,'test-type','{"username":"test280","password":"pass280"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(173,'test-type','{"username":"test281","password":"pass281"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(174,'test-type','{"username":"test282","password":"pass282"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(175,'test-type','{"username":"test283","password":"pass283"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(176,'test-type','{"username":"test284","password":"pass284"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(177,'test-type','{"username":"test285","password":"pass285"}','bound','banned','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(178,'test-type','{"username":"test286","password":"pass286"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(179,'test-type','{"username":"test287","password":"pass287"}','disabled','banned','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(180,'test-type','{"username":"test288","password":"pass288"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(181,'test-type','{"username":"test289","password":"pass289"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(182,'test-type','{"username":"test290","password":"pass290"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(183,'test-type','{"username":"test291","password":"pass291"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(184,'test-type','{"username":"test292","password":"pass292"}','bound','banned','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(185,'test-type','{"username":"test293","password":"pass293"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(186,'test-type','{"username":"test294","password":"pass294"}','disabled','banned','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(187,'test-type','{"username":"test295","password":"pass295"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(188,'test-type','{"username":"test296","password":"pass296"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(189,'test-type','{"username":"test297","password":"pass297"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(190,'test-type','{"username":"test298","password":"pass298"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(191,'test-type','{"username":"test299","password":"pass299"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(192,'test-type','{"username":"test300","password":"pass300"}','bound','ok','2026-04-04 10:06:07');
INSERT INTO "accounts" VALUES(193,'test-type','{"username":"test301","password":"pass301"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(194,'test-type','{"username":"test302","password":"pass302"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(195,'test-type','{"username":"test303","password":"pass303"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(196,'test-type','{"username":"test304","password":"pass304"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(197,'test-type','{"username":"test305","password":"pass305"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(198,'test-type','{"username":"test306","password":"pass306"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(199,'test-type','{"username":"test307","password":"pass307"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(200,'test-type','{"username":"test308","password":"pass308"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(201,'test-type','{"username":"test309","password":"pass309"}','bound','banned','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(202,'test-type','{"username":"test310","password":"pass310"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(203,'test-type','{"username":"test311","password":"pass311"}','bound','banned','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(204,'test-type','{"username":"test312","password":"pass312"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(205,'test-type','{"username":"test313","password":"pass313"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(206,'test-type','{"username":"test314","password":"pass314"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(207,'test-type','{"username":"test315","password":"pass315"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(208,'test-type','{"username":"test316","password":"pass316"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(209,'test-type','{"username":"test317","password":"pass317"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(210,'test-type','{"username":"test318","password":"pass318"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(211,'test-type','{"username":"test319","password":"pass319"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(212,'test-type','{"username":"test320","password":"pass320"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(213,'test-type','{"username":"test321","password":"pass321"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(214,'test-type','{"username":"test322","password":"pass322"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(215,'test-type','{"username":"test323","password":"pass323"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(216,'test-type','{"username":"test324","password":"pass324"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(217,'test-type','{"username":"test325","password":"pass325"}','bound','banned','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(218,'test-type','{"username":"test326","password":"pass326"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(219,'test-type','{"username":"test327","password":"pass327"}','disabled','banned','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(220,'test-type','{"username":"test328","password":"pass328"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(221,'test-type','{"username":"test329","password":"pass329"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(222,'test-type','{"username":"test330","password":"pass330"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(223,'test-type','{"username":"test331","password":"pass331"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(224,'test-type','{"username":"test332","password":"pass332"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(225,'test-type','{"username":"test333","password":"pass333"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(226,'test-type','{"username":"test334","password":"pass334"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(227,'test-type','{"username":"test335","password":"pass335"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(228,'test-type','{"username":"test336","password":"pass336"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(229,'test-type','{"username":"test337","password":"pass337"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(230,'test-type','{"username":"test338","password":"pass338"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(231,'test-type','{"username":"test339","password":"pass339"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(232,'test-type','{"username":"test340","password":"pass340"}','bound','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(233,'test-type','{"username":"test341","password":"pass341"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(234,'test-type','{"username":"test342","password":"pass342"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(235,'test-type','{"username":"test343","password":"pass343"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(236,'test-type','{"username":"test344","password":"pass344"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(237,'test-type','{"username":"test345","password":"pass345"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(238,'test-type','{"username":"test346","password":"pass346"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(239,'test-type','{"username":"test347","password":"pass347"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(240,'test-type','{"username":"test348","password":"pass348"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(241,'test-type','{"username":"test349","password":"pass349"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(242,'test-type','{"username":"test350","password":"pass350"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(243,'test-type','{"username":"test351","password":"pass351"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(244,'test-type','{"username":"test352","password":"pass352"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(245,'test-type','{"username":"test353","password":"pass353"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(246,'test-type','{"username":"test354","password":"pass354"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(247,'test-type','{"username":"test355","password":"pass355"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(248,'test-type','{"username":"test356","password":"pass356"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(249,'test-type','{"username":"test357","password":"pass357"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(250,'test-type','{"username":"test358","password":"pass358"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(251,'test-type','{"username":"test359","password":"pass359"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(252,'test-type','{"username":"test360","password":"pass360"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(253,'test-type','{"username":"test361","password":"pass361"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(254,'test-type','{"username":"test362","password":"pass362"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(255,'test-type','{"username":"test363","password":"pass363"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(256,'test-type','{"username":"test364","password":"pass364"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(257,'test-type','{"username":"test365","password":"pass365"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(258,'test-type','{"username":"test366","password":"pass366"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(259,'test-type','{"username":"test367","password":"pass367"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(260,'test-type','{"username":"test368","password":"pass368"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(261,'test-type','{"username":"test369","password":"pass369"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(262,'test-type','{"username":"test370","password":"pass370"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(263,'test-type','{"username":"test371","password":"pass371"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(264,'test-type','{"username":"test372","password":"pass372"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(265,'test-type','{"username":"test373","password":"pass373"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(266,'test-type','{"username":"test374","password":"pass374"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(267,'test-type','{"username":"test375","password":"pass375"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(268,'test-type','{"username":"test376","password":"pass376"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(269,'test-type','{"username":"test377","password":"pass377"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(270,'test-type','{"username":"test378","password":"pass378"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(271,'test-type','{"username":"test379","password":"pass379"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(272,'test-type','{"username":"test380","password":"pass380"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(273,'test-type','{"username":"test381","password":"pass381"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(274,'test-type','{"username":"test382","password":"pass382"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(275,'test-type','{"username":"test383","password":"pass383"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(276,'test-type','{"username":"test384","password":"pass384"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(277,'test-type','{"username":"test385","password":"pass385"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(278,'test-type','{"username":"test386","password":"pass386"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(279,'test-type','{"username":"test387","password":"pass387"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(280,'test-type','{"username":"test388","password":"pass388"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(281,'test-type','{"username":"test389","password":"pass389"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(282,'test-type','{"username":"test390","password":"pass390"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(283,'test-type','{"username":"test391","password":"pass391"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(284,'test-type','{"username":"test392","password":"pass392"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(285,'test-type','{"username":"test393","password":"pass393"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(286,'test-type','{"username":"test394","password":"pass394"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(287,'test-type','{"username":"test395","password":"pass395"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(288,'test-type','{"username":"test396","password":"pass396"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(289,'test-type','{"username":"test397","password":"pass397"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(290,'test-type','{"username":"test398","password":"pass398"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(291,'test-type','{"username":"test399","password":"pass399"}','available','ok','2026-04-04 11:46:28');
INSERT INTO "accounts" VALUES(292,'test-type','{"username":"test400","password":"pass400"}','available','ok','2026-04-04 11:46:28');
CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hash TEXT NOT NULL UNIQUE,
  pool_code TEXT NOT NULL,
  query_token TEXT,
  aftersale_limit INTEGER NOT NULL DEFAULT 0,
  aftersale_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'normal'
    CHECK (status IN ('normal', 'disabled')),
  lock_until TEXT,
  created_at TEXT NOT NULL
, code_plain TEXT, warranty_hours INTEGER NOT NULL DEFAULT 24, warranty_started_at TEXT, warranty_expires_at TEXT, delivery_ref TEXT, delivered_at TEXT, account_quantity INTEGER NOT NULL DEFAULT 1, order_amount REAL);
INSERT INTO "cards" VALUES(1,'','test-type',NULL,1,0,'normal',NULL,'2026-04-04 08:22:03','TEST-SINGLE-B1FE30AC972F',168,NULL,NULL,'ORDER-20260404-003','2026-04-04T08:58:46.099Z',1,NULL);
INSERT INTO "cards" VALUES(2,'7a7c31d2f539124d5fb1ae394852e1e752de03b2ba098329126b19a1eddc9fd9','test-type',NULL,10,0,'normal',NULL,'2026-04-04T08:37:05.216Z','TEST-3CT8-S79R-EVUG-PRVK',168,'2026-04-04T08:37:41.539Z','2026-04-11T08:37:41.539Z','TEST-ORDER-001','2026-04-04T08:37:05.206Z',10,NULL);
INSERT INTO "cards" VALUES(3,'c6e0d3b3faaa9565299f6ecc372e50498ac614bf4cf811e2f7a9ea4c0597f120','test-type',NULL,5,0,'normal',NULL,'2026-04-04T08:40:24.185Z','TEST-GQPS-SNQC-RQAM-7RQ9',168,NULL,NULL,'TEST-ORDER-002','2026-04-04T08:40:24.179Z',5,NULL);
INSERT INTO "cards" VALUES(4,'5dd5bdaa294c55b1ce7d340b72f87c5692f11e9a7bd4c3e9fdfa193178b8e32d','test-type',NULL,10,0,'normal',NULL,'2026-04-04T08:45:08.762Z','TEST-H6UY-XJ6Q-ENBW-WD2X',168,NULL,NULL,'XIANYU-ORDER-12345','2026-04-04T08:45:08.752Z',10,NULL);
INSERT INTO "cards" VALUES(5,'6900156ad63438b17b255113a90c462b609817a4abf467927170ae1e6e475277','test-type',NULL,5,0,'normal',NULL,'2026-04-04T08:48:09.189Z','TEST-LH8F-UXQ2-KW89-XUKH',168,NULL,NULL,'TEST-SIMPLE-001','2026-04-04T08:48:09.182Z',5,NULL);
INSERT INTO "cards" VALUES(6,'88312448d735cec7f789ca2f66c5d8e829fdf6faec714058f05553111f2a9d1c','test-type',NULL,8,0,'normal',NULL,'2026-04-04T08:48:53.776Z','TEST-JXSY-MY83-U9LU-TU3R',168,NULL,NULL,'TEST-CLEAN-001','2026-04-04T08:48:53.772Z',8,NULL);
INSERT INTO "cards" VALUES(7,'b38f1ea50aceea74bac7df8f13628bc23e8e82224fcc7aa7b31ccd9c73b87087','test-type',NULL,10,0,'normal',NULL,'2026-04-04T08:51:14.697Z','TEST-XSX2-T36D-HJN5-E8WP',168,NULL,NULL,'FINAL-TEST-001','2026-04-04T08:51:14.693Z',10,NULL);
INSERT INTO "cards" VALUES(8,'2e4f6affd897148e85ac961dfd071fec5fc187357ded808be62a59b8ced6f433','test-type',NULL,10,0,'normal',NULL,'2026-04-04T08:58:46.003Z','TEST-UKGU-J8WJ-26FK-E8DD',168,NULL,NULL,'ORDER-20260404-001','2026-04-04T08:58:45.998Z',10,NULL);
INSERT INTO "cards" VALUES(9,'41fc739c06b5892ee51963596b937f5a6bb41a30569ec6ca9e21bde5420b0176','test-type',NULL,5,0,'normal',NULL,'2026-04-04T08:58:46.054Z','TEST-58PS-5EUH-KL2J-UAS7',168,NULL,NULL,'ORDER-20260404-002','2026-04-04T08:58:46.050Z',5,NULL);
INSERT INTO "cards" VALUES(10,'8027f8bbc7319b337c8c2fae97f8dbf2193b01ab80a00ce08a6aeb7b34d4c34c','test-type',NULL,20,0,'normal',NULL,'2026-04-04T08:58:46.132Z','TEST-9YWN-BFZL-J24S-JRVZ',168,NULL,NULL,'ORDER-20260404-004','2026-04-04T08:58:46.127Z',20,NULL);
INSERT INTO "cards" VALUES(11,'977eae7c5c56039999fb18f2e1394d89c96788dbf26ffff8c62a5fef937b1b82','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:12:32.935Z','TEST-9NCJ-CSDG-PGZE-3ZLL',168,NULL,NULL,'ORDER-TEST-20260404-001','2026-04-04T09:12:32.929Z',10,99.99);
INSERT INTO "cards" VALUES(12,'45ff8b2a284791eb2e084c87a0287a7700a1665d8c599d0a09af47cdcee8af68','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:14:01.437Z','TEST-VG58-WLWN-6SA5-SWZ8',168,NULL,NULL,'ORDER-SIMPLE-001','2026-04-04T09:14:01.431Z',10,99.99);
INSERT INTO "cards" VALUES(13,'d0e6a5653d65650c02bf19b031eb8e81826f909ed6e2f8a83f309cbe48b94f4d','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:20:18.063Z','TEST-ZMA9-FAFY-KSN2-MRC3',168,'2026-04-04T09:21:41.607Z','2026-04-11T09:21:41.607Z','PROD-TEST-001','2026-04-04T09:20:18.059Z',10,99.99);
INSERT INTO "cards" VALUES(14,'3b2803a67af63b8671fdfc92e969f0e1f7d6f3e93681fe03ee9131d4c21994a1','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:20:18.210Z','TEST-BU4B-FKN6-DECA-2K7D',168,NULL,NULL,'PROD-TEST-QTY-1','2026-04-04T09:20:18.205Z',1,NULL);
INSERT INTO "cards" VALUES(15,'3d560bc8ed821471c37a06dc5d60e3605dd675778937bc7c04c600b906ff2824','test-type',NULL,5,0,'normal',NULL,'2026-04-04T09:20:18.248Z','TEST-FTMP-G35B-3P9Q-7ZJC',168,NULL,NULL,'PROD-TEST-QTY-5','2026-04-04T09:20:18.244Z',5,NULL);
INSERT INTO "cards" VALUES(16,'372b54832ee5537c85954f0e28340fd08164b2a7903ef2a35a815af364204204','test-type',NULL,20,0,'normal',NULL,'2026-04-04T09:20:18.289Z','TEST-D5CX-2WCN-GZUR-KJ7G',168,NULL,NULL,'PROD-TEST-QTY-20','2026-04-04T09:20:18.284Z',20,NULL);
INSERT INTO "cards" VALUES(17,'2ad02cc0810c298f7f39f2d10bbd3590e23acca48e2b8fcebcba6461c2f63a84','test-type',NULL,3,0,'normal',NULL,'2026-04-04T09:20:18.326Z','TEST-G2F9-C9ZG-AHK9-NX9G',168,NULL,NULL,'PROD-TEST-FORMAT','2026-04-04T09:20:18.322Z',3,NULL);
INSERT INTO "cards" VALUES(18,'819ad7251213b43df90a8892e87b65874587fd9783a6270ea22ad903207f215a','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:43:36.593Z','TEST-T5LF-SFRL-X9PQ-8SDJ',168,'2026-04-04T09:43:52.718Z','2026-04-11T09:43:52.718Z','TEST-1775295816','2026-04-04T09:43:36.589Z',10,NULL);
INSERT INTO "cards" VALUES(19,'64caf89c00b118bfe2eef90357721bde967b3bae1cc49e6e0a985989c485a865','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:44:47.907Z','TEST-682P-F4JG-NCXL-XXC8',168,'2026-04-04T09:44:47.996Z','2026-04-11T09:44:47.996Z','TEST-SINGLE-1775295887','2026-04-04T09:44:47.903Z',1,NULL);
INSERT INTO "cards" VALUES(20,'10d1670981c7c39744d669a0d59c6cb61025e266e39ba287ebd1032d778a71ce','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:44:47.941Z','TEST-RDE4-V5YD-5QXE-YXZ9',168,NULL,NULL,'TEST-MULTI-1775295887','2026-04-04T09:44:47.936Z',10,NULL);
INSERT INTO "cards" VALUES(21,'0bb0f1d69f1c081832cab5f21400e4bf0850c16337ff13c5d88ced6c7de226b1','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:45:09.344Z','TEST-4RC5-5FS3-QFCA-6KXD',168,'2026-04-04T09:45:09.429Z','2026-04-11T09:45:09.429Z','TEST-SINGLE-1775295909','2026-04-04T09:45:09.340Z',1,NULL);
INSERT INTO "cards" VALUES(22,'f7d480c3e019c76345c1b9ffe1adfd19a1cc7d867049b0680b8864dc82e50ad4','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:45:09.375Z','TEST-BTPG-Z69E-M8XP-VPT7',168,NULL,NULL,'TEST-MULTI-1775295909','2026-04-04T09:45:09.371Z',10,NULL);
INSERT INTO "cards" VALUES(23,'330cb9516579b71c0c2950cef2425cc28a5ba713024755fb8b79ca711aba6a67','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:45:18.588Z','TEST-KDS2-RPYB-RPDN-UD9U',168,'2026-04-04T09:45:18.667Z','2026-04-11T09:45:18.667Z','TEST-SINGLE-1775295918','2026-04-04T09:45:18.585Z',1,NULL);
INSERT INTO "cards" VALUES(24,'ec829e99ccb983e5ffcbae85de139c44fb5106db03b354d946108590400a0e27','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:45:18.621Z','TEST-Z5M2-GC9E-8QA7-C5K9',168,NULL,NULL,'TEST-MULTI-1775295918','2026-04-04T09:45:18.618Z',10,NULL);
INSERT INTO "cards" VALUES(25,'7a524ba25016a04ed4a03d6fb5ef12cf1ed0aa1977708409ea974136e5172033','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:45:36.044Z','TEST-Q4HS-HUCG-A9WB-T3ZL',168,'2026-04-04T09:45:36.130Z','2026-04-11T09:45:36.130Z','TEST-SINGLE-1775295936','2026-04-04T09:45:36.039Z',1,NULL);
INSERT INTO "cards" VALUES(26,'cc9dd98f868eea8c1e8ac8680f30a5229c8fc7b8910e019d06c38be5f169be00','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:45:36.081Z','TEST-785B-55CM-VX46-LSPN',168,NULL,NULL,'TEST-MULTI-1775295936','2026-04-04T09:45:36.077Z',10,NULL);
INSERT INTO "cards" VALUES(27,'eb3dc8e4143a288a664d72b25a6f04c8016e20cc3f540ee0a180310bb04b7b80','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:47:40.865Z','TEST-DMRL-N52V-G6LN-DAHF',168,NULL,NULL,'TEST-SINGLE-1775296060','2026-04-04T09:47:40.860Z',1,NULL);
INSERT INTO "cards" VALUES(28,'77ac37041640749b9003521f2379a5da8904e4f7936b0a48e95f39b1c0fdb6a4','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:47:40.895Z','TEST-NDQT-P4Q3-W973-8MXS',168,NULL,NULL,'TEST-MULTI-1775296060','2026-04-04T09:47:40.891Z',10,NULL);
INSERT INTO "cards" VALUES(29,'9b1a83a58ce70d8127d0ac252d1b4afd698b485f7a943744f39a90c220ece122','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:48:09.040Z','TEST-N45C-VEQM-2SBL-TLL2',168,NULL,NULL,'TEST-SINGLE-1775296089','2026-04-04T09:48:09.035Z',1,NULL);
INSERT INTO "cards" VALUES(30,'07f45dd4c8be893ba93c5f7c8d13e943ecd291b7e1baa34153461d2ce000d64d','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:48:09.075Z','TEST-YVN4-Z8WB-P5GN-WV2M',168,'2026-04-04T09:48:09.306Z','2026-04-11T09:48:09.306Z','TEST-MULTI-1775296089','2026-04-04T09:48:09.069Z',10,NULL);
INSERT INTO "cards" VALUES(31,'27c53d016c7cea93b49422a9c92c7e902b0112d15b57b310f30048b586415e12','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:48:40.561Z','TEST-V2YY-SMZ7-UFK8-PVKX',168,NULL,NULL,'FINAL-TEST-1775296120','2026-04-04T09:48:40.558Z',10,NULL);
INSERT INTO "cards" VALUES(32,'91ce57d6da7da4397ab4a86a993eb02e25246da8228579f3e090db06d8e634b7','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:50:32.254Z','TEST-HVLV-XMMT-QRYG-8KN8',168,NULL,NULL,'TEST-SINGLE-1775296232','2026-04-04T09:50:32.250Z',1,NULL);
INSERT INTO "cards" VALUES(33,'34e7c000214a557f8ea8f7edee9dad48f12ae0583937824f1567a1e4163461a1','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:50:32.286Z','TEST-4G7Z-MBJS-6HDH-HGDN',168,'2026-04-04T09:50:32.455Z','2026-04-11T09:50:32.455Z','TEST-MULTI-1775296232','2026-04-04T09:50:32.283Z',10,NULL);
INSERT INTO "cards" VALUES(34,'fd91b8576052357b43689ecefb2d5655f0943a1af524a1f84c022737033dc4eb','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:52:14.566Z','TEST-GJ67-EULT-QP5Q-2P5B',168,NULL,NULL,'TEST-SINGLE-1775296334','2026-04-04T09:52:14.562Z',1,NULL);
INSERT INTO "cards" VALUES(35,'99927b50353dfd004d84dcea29ac992cc7898e882750626eef2fee9312a89c7d','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:52:14.606Z','TEST-GZ45-8UZM-M7G4-8U54',168,'2026-04-04T09:52:14.851Z','2026-04-11T09:52:14.851Z','TEST-MULTI-1775296334','2026-04-04T09:52:14.601Z',10,NULL);
INSERT INTO "cards" VALUES(36,'0a38365f3d13fb8bcb9c247f485067d67f6da44ed14f2d6104080c9b416a8bc0','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:52:28.426Z','TEST-KLX8-D2CZ-J3AN-MLM7',168,NULL,NULL,'DEBUG-TEST-1775296348','2026-04-04T09:52:28.422Z',10,NULL);
INSERT INTO "cards" VALUES(37,'70cab28e65b7453c07430f4276cfb49920c18dba2b3d038b6378a0ef42a8b8e2','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:54:22.049Z','TEST-4CL8-UL5Y-W6AH-PXP2',168,'2026-04-04T09:54:22.145Z','2026-04-11T09:54:22.145Z','TEST-SINGLE-1775296462','2026-04-04T09:54:22.044Z',1,NULL);
INSERT INTO "cards" VALUES(38,'ef513e6418e6068c8c46fd5db4ad7814d9ae3fde27ee83edffe9e637a5f760a8','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:54:22.089Z','TEST-9F4Y-CGAU-JGLM-K2PZ',168,'2026-04-04T09:54:22.268Z','2026-04-11T09:54:22.268Z','TEST-MULTI-1775296462','2026-04-04T09:54:22.083Z',10,NULL);
INSERT INTO "cards" VALUES(39,'40a0b9aa12ca8c8728b019697d9c8f83d78ad96f1481e5e0709b679c9557a8a1','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:54:41.331Z','TEST-CYV3-3F5U-FQ7B-QZ73',168,'2026-04-04T09:54:41.443Z','2026-04-11T09:54:41.443Z','TEST-SINGLE-1775296481','2026-04-04T09:54:41.327Z',1,NULL);
INSERT INTO "cards" VALUES(40,'5e1be188262be0444333fae4210c0ce5576dfe322384b2c3f7828d2e32388b33','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:54:41.389Z','TEST-CREC-5LM7-GSY3-35YN',168,'2026-04-04T09:54:41.555Z','2026-04-11T09:54:41.555Z','TEST-MULTI-1775296481','2026-04-04T09:54:41.383Z',10,NULL);
INSERT INTO "cards" VALUES(41,'358b8527a2c9cab59fe43bb0e76392f82f2dab97613e2f709b4aad783fe956c7','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:57:07.172Z','TEST-A4HM-BEXJ-ZJKD-5GBR',168,'2026-04-04T09:57:07.266Z','2026-04-11T09:57:07.266Z','TEST-SINGLE-1775296627','2026-04-04T09:57:07.166Z',1,NULL);
INSERT INTO "cards" VALUES(42,'48a68ea5d4e2368db31bea3ae6fe3b8593e26c655f2aea70589802f7e64a0d16','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:57:07.210Z','TEST-W9DE-2R6C-PE74-ESXX',168,NULL,NULL,'TEST-MULTI-1775296627','2026-04-04T09:57:07.206Z',10,NULL);
INSERT INTO "cards" VALUES(43,'b697459f7f2ff40a9152e1e6c08de567ee0694eb939c2f4686e203e1aa98deb6','test-type',NULL,1,0,'normal',NULL,'2026-04-04T09:57:18.311Z','TEST-US7F-FQ74-F6JL-7QFJ',168,'2026-04-04T09:57:18.398Z','2026-04-11T09:57:18.398Z','TEST-SINGLE-1775296638','2026-04-04T09:57:18.307Z',1,NULL);
INSERT INTO "cards" VALUES(44,'3756c72c40af8f053893288904a0276857669fa106df40ab4489d50fe09bbf6f','test-type',NULL,10,0,'normal',NULL,'2026-04-04T09:57:18.346Z','TEST-Y5AM-BP92-ZP2V-KSLX',168,NULL,NULL,'TEST-MULTI-1775296638','2026-04-04T09:57:18.342Z',10,NULL);
INSERT INTO "cards" VALUES(45,'3f3ef5f4f0333f03b29228a9018df516960fd60cc5e684dc86b13f1d27ee11b6','test-type',NULL,1,0,'normal',NULL,'2026-04-04T10:05:13.282Z','TEST-KBPZ-PHL9-WYNN-FM4Y',168,'2026-04-04T10:05:13.416Z','2026-04-11T10:05:13.416Z','TEST-SINGLE-1775297113','2026-04-04T10:05:13.276Z',1,NULL);
INSERT INTO "cards" VALUES(46,'f9f7aae50d53cc76b2a1ef2d5d53be42aa68f048c7a3bfc12c605dd43247facf','test-type',NULL,10,0,'normal',NULL,'2026-04-04T10:05:13.329Z','TEST-5VAP-DV38-27KM-TWRD',168,NULL,NULL,'TEST-MULTI-1775297113','2026-04-04T10:05:13.325Z',10,NULL);
INSERT INTO "cards" VALUES(47,'7beb0a4cffe6846c89d54cb7e5417ada63c1b0d5b1c682570355f2c0f3838054','test-type',NULL,10,0,'normal',NULL,'2026-04-04T10:05:27.154Z','TEST-5HZ6-E6S8-G98J-K4RD',168,NULL,NULL,'MANUAL-TEST-1775297127','2026-04-04T10:05:27.149Z',10,NULL);
INSERT INTO "cards" VALUES(48,'f0ff03dcf115f94a41f22f6e82e634acd665379a796b4b91f35e0d1cddd85826','test-type',NULL,1,0,'normal',NULL,'2026-04-04T10:16:02.682Z','TEST-UC7L-64YZ-753T-F5FW',168,'2026-04-04T10:16:02.792Z','2026-04-11T10:16:02.792Z','TEST-SINGLE-1775297762','2026-04-04T10:16:02.676Z',1,NULL);
INSERT INTO "cards" VALUES(49,'2be2d44d71afefb9489c5f28d3db299882126b000e082fae089a851c9ce2702d','test-type',NULL,10,0,'normal',NULL,'2026-04-04T10:16:02.717Z','TEST-8FQD-MYTK-XJVT-CQL4',168,'2026-04-04T10:16:02.901Z','2026-04-11T10:16:02.901Z','TEST-MULTI-1775297762','2026-04-04T10:16:02.714Z',10,NULL);
INSERT INTO "cards" VALUES(50,'9a4cf6450993d810448f493ef5412df5665fd3be6cbabd755e0b8133c1fbc50f','test-type',NULL,1,0,'normal',NULL,'2026-04-04T10:20:24.596Z','TEST-YUE8-LQU6-26TQ-SLSF',168,'2026-04-04T10:20:24.709Z','2026-04-11T10:20:24.709Z','TEST-SINGLE-1775298024','2026-04-04T10:20:24.592Z',1,NULL);
INSERT INTO "cards" VALUES(51,'503e4752da65ef4ab04593fc23ecc33c9f683c9baa2457f80e6add0ae1fa4132','test-type',NULL,10,0,'normal',NULL,'2026-04-04T10:20:24.629Z','TEST-HD9Y-ZZA3-3GBK-KKWY',168,'2026-04-04T10:20:24.816Z','2026-04-11T10:20:24.816Z','TEST-MULTI-1775298024','2026-04-04T10:20:24.625Z',10,NULL);
INSERT INTO "cards" VALUES(52,'c78e72953374fd7c929bacb3875b9250255c093f449e59cae114e748d9382dec','test-type',NULL,91,0,'normal',NULL,'2026-04-04T10:20:25.026Z','TEST-VQ9Q-MGH4-TKQC-CXN3',168,NULL,NULL,'SHORTAGE-TEST-1775298025','2026-04-04T10:20:25.023Z',91,NULL);
INSERT INTO "cards" VALUES(53,'822e9317da0f7fe2ead8609cc8d7a299f54aa702c456cc46a27bf45fcbd79df2','test-type',NULL,2,0,'normal',NULL,'2026-04-04T10:20:25.096Z','TEST-4MNS-LJZU-3SSJ-EBD5',1,'2026-04-04T10:20:25.148Z','2026-04-04T08:20:25Z','WARRANTY-TEST-1775298025','2026-04-04T10:20:25.092Z',2,NULL);
INSERT INTO "cards" VALUES(54,'5da6905607e8e0c29600626cc88749108a5c297334ef89c074fea82b3527739e','test-type',NULL,1,0,'normal',NULL,'2026-04-04T10:20:25.235Z','TEST-3HMJ-VZRK-7GHU-SPLF',168,'2026-04-04T10:20:25.290Z','2026-04-11T10:20:25.290Z','AFTERSALE-TEST-1775298025','2026-04-04T10:20:25.232Z',3,NULL);
INSERT INTO "cards" VALUES(55,'396c81bb1cb78716d9caac0e30c360b3d368e308bebcca9eb225b66678e14884','test-type',NULL,1,0,'normal',NULL,'2026-04-04T10:23:55.159Z','TEST-G5SP-FGNX-7NAD-RP85',168,'2026-04-04T10:23:55.264Z','2026-04-11T10:23:55.264Z','TEST-SINGLE-1775298235','2026-04-04T10:23:55.154Z',1,NULL);
INSERT INTO "cards" VALUES(56,'f360209d74b5de8ed32bef6bca2171314633f6bbe121df44f908a169944997e7','test-type',NULL,10,0,'normal',NULL,'2026-04-04T10:23:55.201Z','TEST-NBMK-HAQJ-69DK-ZEQS',168,'2026-04-04T10:23:55.416Z','2026-04-11T10:23:55.416Z','TEST-MULTI-1775298235','2026-04-04T10:23:55.195Z',10,NULL);
INSERT INTO "cards" VALUES(57,'896e47bf3a7b5414c3d4757da16dc9af43922606943d1b22e6b64c9dd0fe6728','test-type',NULL,75,0,'normal',NULL,'2026-04-04T10:23:55.761Z','TEST-VJ6F-8VMR-RERC-69ZH',168,NULL,NULL,'SHORTAGE-TEST-1775298235','2026-04-04T10:23:55.755Z',75,NULL);
INSERT INTO "cards" VALUES(58,'27b91e452bdbbf3613160817e80e08bd5072bf99d77db6467b890c1eb8af4bd6','test-type',NULL,2,0,'normal',NULL,'2026-04-04T10:23:55.849Z','TEST-G3AU-Q3CM-5RQZ-U3X3',1,'2026-04-04T10:23:55.898Z','2026-04-04T08:23:55Z','WARRANTY-TEST-1775298235','2026-04-04T10:23:55.846Z',2,NULL);
INSERT INTO "cards" VALUES(59,'5e7131dfdb0cd3edac1592398ebc95c24ab76470444a8b8f52517d5198e6f144','test-type',NULL,1,0,'normal',NULL,'2026-04-04T10:23:56.000Z','TEST-24AJ-KQV4-P83B-JV75',168,'2026-04-04T10:23:56.079Z','2026-04-11T10:23:56.079Z','AFTERSALE-TEST-1775298235','2026-04-04T10:23:55.995Z',3,NULL);
INSERT INTO "cards" VALUES(60,'8eb0143d5ea05ba6d7146ee1b0249e1c0b9845a1a639bb915f1224cdd378ea56','test-type',NULL,1,0,'normal',NULL,'2026-04-04T11:41:41.546Z','TEST-BQSJ-ZWJM-DJML-AU48',168,'2026-04-04T11:41:41.629Z','2026-04-11T11:41:41.629Z','TEST-SINGLE-1775302901','2026-04-04T11:41:41.542Z',1,NULL);
INSERT INTO "cards" VALUES(61,'0592a86b01c683ad54a5fb0211926a670d16de2d183cd1631f74e40525b459e2','test-type',NULL,10,0,'normal',NULL,'2026-04-04T11:41:41.580Z','TEST-QYHC-ADC8-NVTR-DZLW',168,'2026-04-04T11:41:41.758Z','2026-04-11T11:41:41.758Z','TEST-MULTI-1775302901','2026-04-04T11:41:41.576Z',10,NULL);
INSERT INTO "cards" VALUES(62,'0764445f9329ec0586c2e727dbcb217ce94233ad2419610f973ca92a6e30cd39','test-type',NULL,59,0,'normal',NULL,'2026-04-04T11:41:41.967Z','TEST-TGTZ-TJYH-46M5-F484',168,NULL,NULL,'SHORTAGE-TEST-1775302901','2026-04-04T11:41:41.964Z',59,NULL);
INSERT INTO "cards" VALUES(63,'07fbe9dee0e7d991a00d2b26fa31228e05c463e72f1f3b4301b38eb86a5b927d','test-type',NULL,2,0,'normal',NULL,'2026-04-04T11:41:42.036Z','TEST-34R8-VPS5-DU9K-TQ6J',1,'2026-04-04T11:41:42.089Z','2026-04-04T09:41:42Z','WARRANTY-TEST-1775302902','2026-04-04T11:41:42.033Z',2,NULL);
INSERT INTO "cards" VALUES(64,'6a3f08e29e2d2c9319e6ef73665264d4ea4d88f5c7391713ffd3bdb8f99fddf6','test-type',NULL,1,0,'normal',NULL,'2026-04-04T11:41:42.202Z','TEST-8UYT-X27S-MVPW-JJ3C',168,'2026-04-04T11:41:42.253Z','2026-04-11T11:41:42.253Z','AFTERSALE-TEST-1775302902','2026-04-04T11:41:42.199Z',3,NULL);
INSERT INTO "cards" VALUES(65,'0384f56a4ffda0b0fce73cde09f2f0862384108d1d6836ede942ecb75d821ff9','test-type',NULL,1,0,'normal',NULL,'2026-04-04T11:42:12.768Z','TEST-N3C3-5SW9-KZS5-73GX',168,'2026-04-04T11:42:12.854Z','2026-04-11T11:42:12.854Z','TEST-SINGLE-1775302932','2026-04-04T11:42:12.765Z',1,NULL);
INSERT INTO "cards" VALUES(66,'fcd50bfcd61042d2b60159890b0f7687b989059ab69a003f50102a37d324ce17','test-type',NULL,10,0,'normal',NULL,'2026-04-04T11:42:12.801Z','TEST-JGZX-3M98-GXRT-HRXM',168,'2026-04-04T11:42:12.961Z','2026-04-11T11:42:12.961Z','TEST-MULTI-1775302932','2026-04-04T11:42:12.798Z',10,NULL);
INSERT INTO "cards" VALUES(67,'bcfbc9ebac96f20690a0165497caf429e0f971c2501404d49736e78f45994bab','test-type',NULL,43,0,'normal',NULL,'2026-04-04T11:42:13.151Z','TEST-GBGV-QWSL-WS4J-VFQ4',168,NULL,NULL,'SHORTAGE-TEST-1775302933','2026-04-04T11:42:13.148Z',43,NULL);
INSERT INTO "cards" VALUES(68,'7277b2efd161e8e5405c10eebdb1c1a33481c551715f5f17abb5a803b3ead56d','test-type',NULL,2,0,'normal',NULL,'2026-04-04T11:42:13.221Z','TEST-2TYJ-Q3JU-BTSW-6W7V',1,'2026-04-04T11:42:13.272Z','2026-04-04T09:42:13Z','WARRANTY-TEST-1775302933','2026-04-04T11:42:13.218Z',2,NULL);
INSERT INTO "cards" VALUES(69,'fc8274311f8112f82247bac1035a6294f9e6393e9af8707e9549b70a39732a5c','test-type',NULL,1,1,'normal',NULL,'2026-04-04T11:42:13.372Z','TEST-M43M-DJD3-TAQP-W3C5',168,'2026-04-04T11:42:13.438Z','2026-04-11T11:42:13.438Z','AFTERSALE-TEST-1775302933','2026-04-04T11:42:13.366Z',3,NULL);
INSERT INTO "cards" VALUES(70,'188bffc19cbb29e42691aa6a9260565dc4f383cabac3fa2924ce7ad2ddacfad5','test-type',NULL,1,0,'normal',NULL,'2026-04-04T11:42:22.655Z','TEST-39BP-YLSQ-3WA3-4G38',168,'2026-04-04T11:42:22.738Z','2026-04-11T11:42:22.738Z','TEST-SINGLE-1775302942','2026-04-04T11:42:22.651Z',1,NULL);
INSERT INTO "cards" VALUES(71,'9341f0948c46cf41b1d44983c1e63857335a5ff0c891fb5609d9ae54ba448994','test-type',NULL,10,0,'normal',NULL,'2026-04-04T11:42:22.689Z','TEST-FNPU-3D4U-YL6P-9BHX',168,'2026-04-04T11:42:22.852Z','2026-04-11T11:42:22.852Z','TEST-MULTI-1775302942','2026-04-04T11:42:22.684Z',10,NULL);
INSERT INTO "cards" VALUES(72,'cf652396869809c9281ff69ad290a3e0802fc5c824ca8f1b573ba8e7e5aee14b','test-type',NULL,26,0,'normal',NULL,'2026-04-04T11:42:23.047Z','TEST-W6UG-SWLZ-PNC9-8RMV',168,NULL,NULL,'SHORTAGE-TEST-1775302943','2026-04-04T11:42:23.039Z',26,NULL);
INSERT INTO "cards" VALUES(73,'40407c221b3ef287ab01df202de7225880b6c00b1cc9a47eb7ac268a2492f0c6','test-type',NULL,2,0,'normal',NULL,'2026-04-04T11:42:23.115Z','TEST-G2W5-TE9G-PLUY-3G8A',1,'2026-04-04T11:42:23.166Z','2026-04-04T09:42:23Z','WARRANTY-TEST-1775302943','2026-04-04T11:42:23.113Z',2,NULL);
INSERT INTO "cards" VALUES(74,'14eaa89cf269e8bd8eed68e3405ba39a0a1f840c7a884d0f18556fdb6e08356a','test-type',NULL,1,1,'normal',NULL,'2026-04-04T11:42:23.253Z','TEST-UWRL-96GB-GKNJ-WRVY',168,'2026-04-04T11:42:23.309Z','2026-04-11T11:42:23.309Z','AFTERSALE-TEST-1775302943','2026-04-04T11:42:23.249Z',3,NULL);
INSERT INTO "cards" VALUES(75,'7cd49d36ecd61ba18f43fb5719c032e309640ac52b0a3a127a10239ddb80bca9','test-type',NULL,1,0,'normal',NULL,'2026-04-04T11:45:59.065Z','TEST-WEVC-JZXB-6H52-DDNH',168,'2026-04-04T11:45:59.150Z','2026-04-11T11:45:59.150Z','TEST-SINGLE-1775303159','2026-04-04T11:45:59.061Z',1,NULL);
INSERT INTO "cards" VALUES(76,'1e2a1da0ed17aa87074348a143e7ec4fadcc9b6528391667bb992325dd175d28','test-type',NULL,10,0,'normal',NULL,'2026-04-04T11:45:59.101Z','TEST-GGVL-PS9M-CURB-BXDC',168,NULL,NULL,'TEST-MULTI-1775303159','2026-04-04T11:45:59.098Z',10,NULL);
INSERT INTO "cards" VALUES(77,'68f2a9077a88bbc40f5a2d1f1d454f68802f1d40ef5f2620c3ccb8d8648a16aa','test-type',NULL,19,0,'normal',NULL,'2026-04-04T11:45:59.430Z','TEST-SDYF-B3L3-QN4F-6T45',168,NULL,NULL,'SHORTAGE-TEST-1775303159','2026-04-04T11:45:59.426Z',19,NULL);
INSERT INTO "cards" VALUES(78,'2c69f9004d8222230a3e8b54d3af3989051d975e2086674f093111a374f30330','test-type',NULL,2,0,'normal',NULL,'2026-04-04T11:45:59.518Z','TEST-3XBK-5U9S-Z5QL-HGF5',1,'2026-04-04T11:45:59.575Z','2026-04-04T09:45:59Z','WARRANTY-TEST-1775303159','2026-04-04T11:45:59.513Z',2,NULL);
INSERT INTO "cards" VALUES(79,'6aaa01f320b8bc347d967313e17656cce44ab46014720ff6516681ada948f465','test-type',NULL,1,1,'normal',NULL,'2026-04-04T11:45:59.692Z','TEST-XCDV-W3H9-QZ7R-Q2BN',168,'2026-04-04T11:45:59.765Z','2026-04-11T11:45:59.765Z','AFTERSALE-TEST-1775303159','2026-04-04T11:45:59.683Z',3,NULL);
INSERT INTO "cards" VALUES(80,'e7efcc6b00bf9334838b0c200b16ccb769fe99acffa89aaa85a657ad74abeef8','test-type',NULL,1,0,'normal',NULL,'2026-04-04T11:46:38.420Z','TEST-MDHX-UWX9-8WPK-ZV3J',168,'2026-04-04T11:46:38.497Z','2026-04-11T11:46:38.497Z','TEST-SINGLE-1775303198','2026-04-04T11:46:38.416Z',1,NULL);
INSERT INTO "cards" VALUES(81,'5bb00691b2961c7799bd702c03e682400c7001fe9f46020443034e61e53df892','test-type',NULL,10,0,'normal',NULL,'2026-04-04T11:46:38.451Z','TEST-A899-REBD-UKT6-NUN8',168,'2026-04-04T11:46:38.606Z','2026-04-11T11:46:38.606Z','TEST-MULTI-1775303198','2026-04-04T11:46:38.448Z',10,NULL);
INSERT INTO "cards" VALUES(82,'a1c943190e8c2d33758046ea50ca6dc3d4cfad0ac08036c939805d751c052431','test-type',NULL,2,0,'normal',NULL,'2026-04-04T11:46:38.789Z','TEST-EN63-WBKX-PGFJ-G8WU',1,'2026-04-04T11:46:38.841Z','2026-04-04T09:46:38Z','WARRANTY-TEST-1775303198','2026-04-04T11:46:38.786Z',2,NULL);
INSERT INTO "cards" VALUES(83,'d2f6fd1c4b0ee60dcbcbf3505ebe2a75b89b754207e3e3ce06650e82fb3da908','test-type',NULL,1,0,'normal',NULL,'2026-04-04T11:46:38.903Z','TEST-Z5JZ-4XNS-2NWL-GCMN',168,'2026-04-04T11:46:38.959Z','2026-04-11T11:46:38.959Z','AFTERSALE-TEST-1775303198','2026-04-04T11:46:38.898Z',3,NULL);
INSERT INTO "cards" VALUES(84,'8c3d4d861e99d109082413f8b10da7ae5e429622211fd85384a00cb4c9799101','test-type',NULL,1,0,'normal',NULL,'2026-04-04T11:49:41.434Z','TEST-HRCX-J8VM-7CMW-3VHT',168,'2026-04-04T11:49:41.518Z','2026-04-11T11:49:41.518Z','TEST-SINGLE-1775303381','2026-04-04T11:49:41.431Z',1,NULL);
INSERT INTO "cards" VALUES(85,'e95766b5f997d173c0443b4be9919ea9c8481f65ec5008ad0debfb3f68008c43','test-type',NULL,10,0,'normal',NULL,'2026-04-04T11:49:41.469Z','TEST-8VYG-TGVF-7HHA-7KZB',168,'2026-04-04T11:49:41.680Z','2026-04-11T11:49:41.680Z','TEST-MULTI-1775303381','2026-04-04T11:49:41.463Z',10,NULL);
INSERT INTO "cards" VALUES(86,'fd4ccf693216840b9e7b6d6e89f8c58e53bb47fbe775c57c3437c2062ff33ea0','test-type',NULL,86,0,'normal',NULL,'2026-04-04T11:49:41.894Z','TEST-ESSV-CAGC-YML4-XAHM',168,NULL,NULL,'SHORTAGE-TEST-1775303381','2026-04-04T11:49:41.891Z',86,NULL);
INSERT INTO "cards" VALUES(87,'c27c834cbcdc9a919202bbe3543d4afda5be01a5970ec836819afb549e8a5184','test-type',NULL,2,0,'normal',NULL,'2026-04-04T11:49:41.973Z','TEST-7YML-ZNJR-QV4V-4G27',1,'2026-04-04T11:49:42.047Z','2026-04-04T09:49:42Z','WARRANTY-TEST-1775303381','2026-04-04T11:49:41.969Z',2,NULL);
INSERT INTO "cards" VALUES(88,'1603889ce03d29baf4a4028de9dbbe3cdb82e7a5106bb9b89c69341b9d1de964','test-type',NULL,1,1,'normal',NULL,'2026-04-04T11:49:42.141Z','TEST-LYBQ-SEZ4-D7VQ-MJUC',168,'2026-04-04T11:49:42.198Z','2026-04-11T11:49:42.198Z','AFTERSALE-TEST-1775303382','2026-04-04T11:49:42.138Z',3,NULL);
INSERT INTO "cards" VALUES(89,'f67c26053864ded778c804c71f554b632e042cf55abe899b57dee8af2510f2f1','test-type',NULL,10,0,'normal',NULL,'2026-04-04T12:08:37.127Z','TEST-MX8K-PJKQ-CWFH-6ZNS',168,'2026-04-04T12:08:45.364Z','2026-04-11T12:08:45.364Z','DEBUG-TEST-001','2026-04-04T12:08:37.121Z',10,NULL);
INSERT INTO "cards" VALUES(90,'61a6825bd8961a13c69a669ea432d055e14261e8067577eca80a3a6f688dbce9','test-type',NULL,1,0,'normal',NULL,'2026-04-04T12:12:21.269Z','TEST-Y9T8-E3AZ-JT4W-F3Y7',168,NULL,NULL,'PROD-TEST-SINGLE-001','2026-04-04T12:12:21.264Z',1,NULL);
CREATE TABLE bindings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  kind TEXT NOT NULL
    CHECK (kind IN ('redeem', 'replace')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended')),
  created_at TEXT NOT NULL,
  ended_at TEXT,
  FOREIGN KEY (card_id) REFERENCES cards(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
INSERT INTO "bindings" VALUES(1,19,31,'redeem','active','2026-04-04T09:44:47.993Z',NULL);
INSERT INTO "bindings" VALUES(2,21,32,'redeem','active','2026-04-04T09:45:09.425Z',NULL);
INSERT INTO "bindings" VALUES(3,23,33,'redeem','active','2026-04-04T09:45:18.664Z',NULL);
INSERT INTO "bindings" VALUES(4,25,34,'redeem','active','2026-04-04T09:45:36.126Z',NULL);
INSERT INTO "bindings" VALUES(5,37,65,'redeem','active','2026-04-04T09:54:22.141Z',NULL);
INSERT INTO "bindings" VALUES(6,39,76,'redeem','active','2026-04-04T09:54:41.440Z',NULL);
INSERT INTO "bindings" VALUES(7,41,87,'redeem','active','2026-04-04T09:57:07.263Z',NULL);
INSERT INTO "bindings" VALUES(8,43,88,'redeem','active','2026-04-04T09:57:18.394Z',NULL);
INSERT INTO "bindings" VALUES(9,45,89,'redeem','active','2026-04-04T10:05:13.412Z',NULL);
INSERT INTO "bindings" VALUES(10,48,90,'redeem','active','2026-04-04T10:16:02.787Z',NULL);
INSERT INTO "bindings" VALUES(11,50,101,'redeem','active','2026-04-04T10:20:24.702Z',NULL);
INSERT INTO "bindings" VALUES(12,55,117,'redeem','active','2026-04-04T10:23:55.261Z',NULL);
CREATE TABLE auth_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  limiter_key TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT,
  updated_at TEXT NOT NULL
);
INSERT INTO "auth_rate_limits" VALUES(12,'public_redeem','::1',1,'2026-04-04T12:13:52.682Z',NULL,'2026-04-04T12:13:52.682Z');
INSERT INTO "auth_rate_limits" VALUES(13,'public_card_submit','::1',4,'2026-04-04T11:49:41.782Z',NULL,'2026-04-04T11:49:42.347Z');
CREATE TABLE account_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
INSERT INTO "account_types" VALUES(1,'test-type','2026-04-04 08:08:13');
CREATE TABLE card_account_pool (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'replaced')),
  created_at TEXT NOT NULL,
  replaced_at TEXT,
  replaced_by_position INTEGER,
  FOREIGN KEY (card_id) REFERENCES cards(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
INSERT INTO "card_account_pool" VALUES(1,2,1,1,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(2,2,2,2,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(3,2,3,3,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(4,2,4,4,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(5,2,5,5,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(6,2,6,6,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(7,2,7,7,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(8,2,8,8,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(9,2,9,9,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(10,2,10,10,'active','2026-04-04T08:37:41.524Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(11,13,11,1,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(12,13,12,2,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(13,13,13,3,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(14,13,14,4,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(15,13,15,5,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(16,13,16,6,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(17,13,17,7,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(18,13,18,8,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(19,13,19,9,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(20,13,20,10,'active','2026-04-04T09:21:41.592Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(21,18,21,1,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(22,18,22,2,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(23,18,23,3,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(24,18,24,4,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(25,18,25,5,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(26,18,26,6,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(27,18,27,7,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(28,18,28,8,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(29,18,29,9,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(30,18,30,10,'active','2026-04-04T09:43:52.704Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(31,30,35,1,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(32,30,36,2,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(33,30,37,3,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(34,30,38,4,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(35,30,39,5,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(36,30,40,6,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(37,30,41,7,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(38,30,42,8,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(39,30,43,9,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(40,30,44,10,'active','2026-04-04T09:48:09.293Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(41,33,45,1,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(42,33,46,2,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(43,33,47,3,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(44,33,48,4,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(45,33,49,5,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(46,33,50,6,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(47,33,51,7,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(48,33,52,8,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(49,33,53,9,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(50,33,54,10,'active','2026-04-04T09:50:32.444Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(51,35,55,1,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(52,35,56,2,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(53,35,57,3,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(54,35,58,4,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(55,35,59,5,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(56,35,60,6,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(57,35,61,7,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(58,35,62,8,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(59,35,63,9,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(60,35,64,10,'active','2026-04-04T09:52:14.836Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(61,38,66,1,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(62,38,67,2,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(63,38,68,3,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(64,38,69,4,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(65,38,70,5,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(66,38,71,6,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(67,38,72,7,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(68,38,73,8,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(69,38,74,9,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(70,38,75,10,'active','2026-04-04T09:54:22.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(71,40,77,1,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(72,40,78,2,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(73,40,79,3,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(74,40,80,4,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(75,40,81,5,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(76,40,82,6,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(77,40,83,7,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(78,40,84,8,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(79,40,85,9,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(80,40,86,10,'active','2026-04-04T09:54:41.536Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(81,49,91,1,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(82,49,92,2,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(83,49,93,3,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(84,49,94,4,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(85,49,95,5,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(86,49,96,6,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(87,49,97,7,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(88,49,98,8,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(89,49,99,9,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(90,49,100,10,'active','2026-04-04T10:16:02.889Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(91,51,102,1,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(92,51,103,2,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(93,51,104,3,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(94,51,105,4,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(95,51,106,5,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(96,51,107,6,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(97,51,108,7,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(98,51,109,8,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(99,51,110,9,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(100,51,111,10,'active','2026-04-04T10:20:24.801Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(101,53,112,1,'active','2026-04-04T10:20:25.144Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(102,53,113,2,'active','2026-04-04T10:20:25.144Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(103,54,114,1,'active','2026-04-04T10:20:25.283Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(104,54,115,2,'active','2026-04-04T10:20:25.283Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(105,54,116,3,'active','2026-04-04T10:20:25.283Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(106,56,118,1,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(107,56,119,2,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(108,56,120,3,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(109,56,121,4,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(110,56,122,5,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(111,56,123,6,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(112,56,124,7,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(113,56,125,8,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(114,56,126,9,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(115,56,127,10,'active','2026-04-04T10:23:55.390Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(116,58,128,1,'active','2026-04-04T10:23:55.894Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(117,58,129,2,'active','2026-04-04T10:23:55.894Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(118,59,130,1,'active','2026-04-04T10:23:56.075Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(119,59,131,2,'active','2026-04-04T10:23:56.075Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(120,59,132,3,'active','2026-04-04T10:23:56.075Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(121,19,31,1,'active','2026-04-04T09:44:47.993Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(122,21,32,1,'active','2026-04-04T09:45:09.425Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(123,23,33,1,'active','2026-04-04T09:45:18.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(124,25,34,1,'active','2026-04-04T09:45:36.126Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(125,37,65,1,'active','2026-04-04T09:54:22.141Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(126,39,76,1,'active','2026-04-04T09:54:41.440Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(127,41,87,1,'active','2026-04-04T09:57:07.263Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(128,43,88,1,'active','2026-04-04T09:57:18.394Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(129,45,89,1,'active','2026-04-04T10:05:13.412Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(130,48,90,1,'active','2026-04-04T10:16:02.787Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(131,50,101,1,'active','2026-04-04T10:20:24.702Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(132,55,117,1,'active','2026-04-04T10:23:55.261Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(133,60,133,1,'active','2026-04-04T11:41:41.626Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(134,61,134,1,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(135,61,135,2,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(136,61,136,3,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(137,61,137,4,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(138,61,138,5,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(139,61,139,6,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(140,61,140,7,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(141,61,141,8,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(142,61,142,9,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(143,61,143,10,'active','2026-04-04T11:41:41.743Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(144,63,144,1,'active','2026-04-04T11:41:42.084Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(145,63,145,2,'active','2026-04-04T11:41:42.084Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(146,64,146,1,'active','2026-04-04T11:41:42.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(147,64,147,2,'active','2026-04-04T11:41:42.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(148,64,148,3,'active','2026-04-04T11:41:42.248Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(149,65,149,1,'active','2026-04-04T11:42:12.848Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(150,66,150,1,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(151,66,151,2,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(152,66,152,3,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(153,66,153,4,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(154,66,154,5,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(155,66,155,6,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(156,66,156,7,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(157,66,157,8,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(158,66,158,9,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(159,66,159,10,'active','2026-04-04T11:42:12.946Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(160,68,160,1,'active','2026-04-04T11:42:13.268Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(161,68,161,2,'active','2026-04-04T11:42:13.268Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(162,69,162,1,'replaced','2026-04-04T11:42:13.433Z','2026-04-04T11:42:13.500Z',4);
INSERT INTO "card_account_pool" VALUES(163,69,163,2,'active','2026-04-04T11:42:13.433Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(164,69,164,3,'active','2026-04-04T11:42:13.433Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(165,69,165,4,'active','2026-04-04T11:42:13.500Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(166,70,166,1,'active','2026-04-04T11:42:22.734Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(167,71,167,1,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(168,71,168,2,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(169,71,169,3,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(170,71,170,4,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(171,71,171,5,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(172,71,172,6,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(173,71,173,7,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(174,71,174,8,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(175,71,175,9,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(176,71,176,10,'active','2026-04-04T11:42:22.838Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(177,73,177,1,'active','2026-04-04T11:42:23.162Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(178,73,178,2,'active','2026-04-04T11:42:23.162Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(179,74,179,1,'replaced','2026-04-04T11:42:23.304Z','2026-04-04T11:42:23.366Z',4);
INSERT INTO "card_account_pool" VALUES(180,74,180,2,'active','2026-04-04T11:42:23.304Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(181,74,181,3,'active','2026-04-04T11:42:23.304Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(182,74,182,4,'active','2026-04-04T11:42:23.366Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(183,75,183,1,'active','2026-04-04T11:45:59.147Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(184,78,184,1,'active','2026-04-04T11:45:59.570Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(185,78,185,2,'active','2026-04-04T11:45:59.570Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(186,79,186,1,'replaced','2026-04-04T11:45:59.760Z','2026-04-04T11:45:59.834Z',4);
INSERT INTO "card_account_pool" VALUES(187,79,187,2,'active','2026-04-04T11:45:59.760Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(188,79,188,3,'active','2026-04-04T11:45:59.760Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(189,79,189,4,'active','2026-04-04T11:45:59.834Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(190,80,190,1,'active','2026-04-04T11:46:38.495Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(191,81,191,1,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(192,81,192,2,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(193,81,193,3,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(194,81,194,4,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(195,81,195,5,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(196,81,196,6,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(197,81,197,7,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(198,81,198,8,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(199,81,199,9,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(200,81,200,10,'active','2026-04-04T11:46:38.591Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(201,82,201,1,'active','2026-04-04T11:46:38.837Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(202,82,202,2,'active','2026-04-04T11:46:38.837Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(203,83,203,1,'active','2026-04-04T11:46:38.951Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(204,83,204,2,'active','2026-04-04T11:46:38.951Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(205,83,205,3,'active','2026-04-04T11:46:38.951Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(206,84,206,1,'active','2026-04-04T11:49:41.514Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(207,85,207,1,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(208,85,208,2,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(209,85,209,3,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(210,85,210,4,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(211,85,211,5,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(212,85,212,6,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(213,85,213,7,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(214,85,214,8,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(215,85,215,9,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(216,85,216,10,'active','2026-04-04T11:49:41.664Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(217,87,217,1,'active','2026-04-04T11:49:42.043Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(218,87,218,2,'active','2026-04-04T11:49:42.043Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(219,88,219,1,'replaced','2026-04-04T11:49:42.193Z','2026-04-04T11:49:42.258Z',4);
INSERT INTO "card_account_pool" VALUES(220,88,220,2,'active','2026-04-04T11:49:42.193Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(221,88,221,3,'active','2026-04-04T11:49:42.193Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(222,88,222,4,'active','2026-04-04T11:49:42.258Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(223,89,223,1,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(224,89,224,2,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(225,89,225,3,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(226,89,226,4,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(227,89,227,5,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(228,89,228,6,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(229,89,229,7,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(230,89,230,8,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(231,89,231,9,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
INSERT INTO "card_account_pool" VALUES(232,89,232,10,'active','2026-04-04T12:08:45.345Z',NULL,NULL);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',9);
INSERT INTO "sqlite_sequence" VALUES('auth_rate_limits',13);
INSERT INTO "sqlite_sequence" VALUES('card_account_pool',232);
INSERT INTO "sqlite_sequence" VALUES('account_types',1);
INSERT INTO "sqlite_sequence" VALUES('accounts',292);
INSERT INTO "sqlite_sequence" VALUES('cards',90);
INSERT INTO "sqlite_sequence" VALUES('bindings',12);
CREATE INDEX idx_accounts_pool
ON accounts(pool_code, stock_status, check_status);
CREATE INDEX idx_cards_pool
ON cards(pool_code, status);
CREATE UNIQUE INDEX idx_bindings_active_card
ON bindings(card_id)
WHERE status = 'active';
CREATE UNIQUE INDEX idx_bindings_active_account
ON bindings(account_id)
WHERE status = 'active';
CREATE INDEX idx_bindings_created
ON bindings(created_at, kind);
CREATE UNIQUE INDEX idx_auth_rate_limits_action_key
ON auth_rate_limits(action, limiter_key);
CREATE INDEX idx_auth_rate_limits_blocked
ON auth_rate_limits(action, blocked_until);
CREATE UNIQUE INDEX idx_cards_code_plain
ON cards(code_plain);
CREATE UNIQUE INDEX idx_account_types_code
ON account_types(code);
CREATE INDEX idx_cards_delivery_ref
ON cards(delivery_ref, delivered_at);
CREATE INDEX idx_cards_delivery_pool
ON cards(pool_code, status, delivered_at);
CREATE INDEX idx_card_account_pool_card
ON card_account_pool(card_id, status);
CREATE INDEX idx_card_account_pool_account
ON card_account_pool(account_id);
CREATE UNIQUE INDEX idx_card_account_pool_card_position_active
ON card_account_pool(card_id, position)
WHERE status = 'active';
CREATE INDEX idx_bindings_account_id
ON bindings(account_id);
CREATE INDEX idx_bindings_status_created
ON bindings(status, created_at DESC);
CREATE INDEX idx_accounts_stock_check
ON accounts(stock_status, check_status, pool_code);
CREATE INDEX idx_cards_order_amount ON cards(order_amount);