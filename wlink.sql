-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: urbanchat
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '35f1f18e-371f-11f1-80d5-5cb47e3771c9:1-1565';

--
-- Table structure for table `affiliate_referrals`
--

DROP TABLE IF EXISTS `affiliate_referrals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliate_referrals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `affiliate_id` int DEFAULT NULL,
  `referred_business_id` int DEFAULT NULL,
  `commission` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `affiliate_id` (`affiliate_id`),
  CONSTRAINT `affiliate_referrals_ibfk_1` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliate_referrals`
--

LOCK TABLES `affiliate_referrals` WRITE;
/*!40000 ALTER TABLE `affiliate_referrals` DISABLE KEYS */;
/*!40000 ALTER TABLE `affiliate_referrals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `affiliates`
--

DROP TABLE IF EXISTS `affiliates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `referral_code` varchar(20) DEFAULT NULL,
  `total_referrals` int DEFAULT '0',
  `total_earnings` decimal(10,2) DEFAULT '0.00',
  `pending_payout` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `referral_code` (`referral_code`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `affiliates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliates`
--

LOCK TABLES `affiliates` WRITE;
/*!40000 ALTER TABLE `affiliates` DISABLE KEYS */;
/*!40000 ALTER TABLE `affiliates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics`
--

DROP TABLE IF EXISTS `analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `metric_type` varchar(100) DEFAULT NULL,
  `metric_value` decimal(15,2) DEFAULT NULL,
  `dimension` varchar(100) DEFAULT NULL,
  `recorded_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `analytics_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics`
--

LOCK TABLES `analytics` WRITE;
/*!40000 ALTER TABLE `analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `broadcast_logs`
--

DROP TABLE IF EXISTS `broadcast_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcast_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `broadcast_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `status` enum('sent','delivered','read','failed') DEFAULT 'sent',
  `wa_message_id` varchar(100) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `broadcast_id` (`broadcast_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `broadcast_logs_ibfk_1` FOREIGN KEY (`broadcast_id`) REFERENCES `broadcasts` (`id`),
  CONSTRAINT `broadcast_logs_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcast_logs`
--

LOCK TABLES `broadcast_logs` WRITE;
/*!40000 ALTER TABLE `broadcast_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcast_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `broadcasts`
--

DROP TABLE IF EXISTS `broadcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcasts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `template_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `target_tags` json DEFAULT NULL,
  `target_contact_ids` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','scheduled','running','completed','failed') DEFAULT 'draft',
  `total_recipients` int DEFAULT '0',
  `total_sent` int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_read` int DEFAULT '0',
  `total_failed` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `broadcasts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `broadcasts_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcasts`
--

LOCK TABLES `broadcasts` WRITE;
/*!40000 ALTER TABLE `broadcasts` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcasts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `businesses`
--

DROP TABLE IF EXISTS `businesses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `businesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `whatsapp_number` varchar(20) DEFAULT NULL,
  `fb_page_id` varchar(100) DEFAULT NULL,
  `ig_account_id` varchar(100) DEFAULT NULL,
  `whatsapp_token` text,
  `whatsapp_phone_id` varchar(100) DEFAULT NULL,
  `fb_verify_token` varchar(100) DEFAULT NULL,
  `plan` enum('starter','pro','enterprise') DEFAULT 'starter',
  `green_tick_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `businesses`
--

LOCK TABLES `businesses` WRITE;
/*!40000 ALTER TABLE `businesses` DISABLE KEYS */;
INSERT INTO `businesses` VALUES (1,'Demo Business','+1(555)637-7030',NULL,NULL,'EAASQM6HaNasBRSAmEcWeP7bWf74YLqZCsaZAsuN3r246owpJAyRGqK3jqfykKBMugvF3Jw9ELwu3t9O1RZCP9UFpfkZAwbierKf2POmaI7DlAR9zZBY7UuCUFbo7UW1NC4vgYZBcfO343LMyqJu4wjQr3IIQDGeeh3znLHZCbcoYnEzrbZAyDIX5asTuPrsVVhsa0GflncIpQhlk7CAPj3ufr6SGHXeVjT3KEI8Tfg33RTkog3eaQCqxGFjj7dPmVABvz3TqcRIy8k7Qb7H2z0jO','1010252335515897','12345','pro','pending','2026-04-29 08:59:39'),(2,'chillie','4525251234567890-',NULL,NULL,NULL,NULL,NULL,'starter','pending','2026-04-29 09:03:55'),(3,'chillie','9048501094',NULL,NULL,NULL,NULL,NULL,'starter','pending','2026-04-29 10:17:21'),(4,'chilli & Co','9048501094',NULL,NULL,NULL,NULL,NULL,'starter','pending','2026-04-30 03:47:18');
/*!40000 ALTER TABLE `businesses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatbot_sessions`
--

DROP TABLE IF EXISTS `chatbot_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatbot_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chatbot_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `current_node_id` varchar(100) DEFAULT NULL,
  `session_data` json DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chatbot_id` (`chatbot_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `chatbot_sessions_ibfk_1` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbots` (`id`),
  CONSTRAINT `chatbot_sessions_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbot_sessions`
--

LOCK TABLES `chatbot_sessions` WRITE;
/*!40000 ALTER TABLE `chatbot_sessions` DISABLE KEYS */;
INSERT INTO `chatbot_sessions` VALUES (3,1,11,'end',NULL,'2026-04-30 08:39:23','2026-04-30 08:39:41'),(5,1,14,'collect_choice',NULL,'2026-05-05 06:30:57','2026-05-05 06:30:57');
/*!40000 ALTER TABLE `chatbot_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatbots`
--

DROP TABLE IF EXISTS `chatbots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatbots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `trigger_keywords` json DEFAULT NULL,
  `flow` json DEFAULT NULL,
  `ai_enabled` tinyint(1) DEFAULT '0',
  `openai_system_prompt` text,
  `is_active` tinyint(1) DEFAULT '1',
  `channel` enum('whatsapp','facebook','instagram','website') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `chatbots_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbots`
--

LOCK TABLES `chatbots` WRITE;
/*!40000 ALTER TABLE `chatbots` DISABLE KEYS */;
INSERT INTO `chatbots` VALUES (1,1,'Main Support Bot','[\"hi\", \"hello\", \"help\", \"start\"]','{\"edges\": [], \"nodes\": [{\"id\": \"start\", \"next\": \"collect_choice\", \"type\": \"message\", \"content\": \"Welcome! How can I help you today?\\n1. Support\\n2. Sales\\n3. Track Order\"}, {\"id\": \"collect_choice\", \"next\": \"route\", \"type\": \"collect_input\", \"content\": \"Please type your choice (1/2/3)\"}, {\"id\": \"route\", \"type\": \"condition\", \"rules\": [{\"next\": \"support\", \"match\": \"1\"}, {\"next\": \"sales\", \"match\": \"2\"}, {\"next\": \"track\", \"match\": \"3\"}], \"default\": \"end\"}, {\"id\": \"support\", \"next\": \"end\", \"type\": \"message\", \"content\": \"Connecting you to our support team. Please wait...\"}, {\"id\": \"sales\", \"next\": \"end\", \"type\": \"message\", \"content\": \"Our sales team will contact you shortly!\"}, {\"id\": \"track\", \"next\": \"end\", \"type\": \"message\", \"content\": \"Please share your order number and we will update you.\"}, {\"id\": \"end\", \"type\": \"end\", \"content\": \"Thank you for contacting us!\"}]}',0,NULL,1,'whatsapp','2026-04-29 08:59:39'),(2,1,'sales helper','[\"hi\", \"hello\", \"hii\", \"hey\"]','{\"edges\": [], \"nodes\": []}',1,NULL,0,'whatsapp','2026-05-05 04:03:41');
/*!40000 ALTER TABLE `chatbots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `opted_in` tinyint(1) DEFAULT '0',
  `opt_in_date` timestamp NULL DEFAULT NULL,
  `opt_out_date` timestamp NULL DEFAULT NULL,
  `opt_in_source` enum('manual','link','whatsapp','import') DEFAULT 'manual',
  `channel_preference` enum('whatsapp','sms','rcs') DEFAULT 'whatsapp',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,1,'Alice Johnson','+911111111111','alice@example.com','[\"vip\", \"customer\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(2,1,'Bob Smith','+912222222222','bob@example.com','[\"lead\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(3,1,'Carol White','+913333333333','carol@example.com','[\"vip\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(4,1,'David Brown','+914444444444','david@example.com','[\"customer\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(5,1,'Eve Davis','+915555555555','eve@example.com','[\"lead\", \"vip\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(6,1,'Frank Miller','+916666666666','frank@example.com','[\"customer\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(7,1,'Grace Wilson','+917777777777','grace@example.com','[\"lead\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(8,1,'Henry Moore','+918888888888','henry@example.com','[\"vip\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(9,1,'Iris Taylor','+919999999999','iris@example.com','[\"customer\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(10,1,'Jack Anderson','+910000000000','jack@example.com','[\"lead\", \"customer\"]',1,NULL,NULL,'manual','whatsapp','2026-04-29 08:59:39'),(11,1,'Widget_::1','Widget_::1',NULL,NULL,0,NULL,NULL,'manual','whatsapp','2026-04-30 04:31:35'),(12,1,'test2','+1(555)637-7030',NULL,'[]',0,NULL,NULL,'manual','whatsapp','2026-05-04 09:48:29'),(13,1,NULL,'919000000000',NULL,NULL,1,NULL,NULL,'whatsapp','whatsapp','2026-05-05 04:25:30'),(14,1,NULL,'918888888888',NULL,NULL,1,NULL,NULL,'whatsapp','whatsapp','2026-05-05 06:30:27'),(15,1,'salman','+91 9048501094','salmansajeer321@gmail.com','[\"customer\"]',0,NULL,NULL,'manual','whatsapp','2026-05-05 06:35:20'),(16,1,'My Authorized Phone','919895095713',NULL,NULL,1,NULL,NULL,'whatsapp','whatsapp','2026-05-05 06:40:59');
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `channel` enum('whatsapp','facebook','instagram','website') DEFAULT 'whatsapp',
  `status` enum('open','resolved','pending') DEFAULT 'open',
  `assigned_to` int DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `contact_id` (`contact_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`),
  CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,1,11,'website','resolved',NULL,'2026-04-30 08:39:41','2026-04-30 08:34:02'),(2,1,13,'whatsapp','open',NULL,'2026-05-05 06:28:46','2026-05-05 04:25:30'),(3,1,14,'whatsapp','open',NULL,'2026-05-05 06:32:17','2026-05-05 06:30:27'),(4,1,16,'whatsapp','open',NULL,'2026-05-05 06:40:59','2026-05-05 06:40:59');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ctwa_clicks`
--

DROP TABLE IF EXISTS `ctwa_clicks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctwa_clicks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `link_id` int DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `referrer` varchar(500) DEFAULT NULL,
  `clicked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `link_id` (`link_id`),
  CONSTRAINT `ctwa_clicks_ibfk_1` FOREIGN KEY (`link_id`) REFERENCES `ctwa_links` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctwa_clicks`
--

LOCK TABLES `ctwa_clicks` WRITE;
/*!40000 ALTER TABLE `ctwa_clicks` DISABLE KEYS */;
/*!40000 ALTER TABLE `ctwa_clicks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ctwa_links`
--

DROP TABLE IF EXISTS `ctwa_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctwa_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `pre_filled_message` text,
  `utm_source` varchar(100) DEFAULT NULL,
  `utm_medium` varchar(100) DEFAULT NULL,
  `utm_campaign` varchar(100) DEFAULT NULL,
  `short_code` varchar(20) DEFAULT NULL,
  `qr_code_url` varchar(500) DEFAULT NULL,
  `click_count` int DEFAULT '0',
  `conversation_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `short_code` (`short_code`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `ctwa_links_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctwa_links`
--

LOCK TABLES `ctwa_links` WRITE;
/*!40000 ALTER TABLE `ctwa_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `ctwa_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drip_campaigns`
--

DROP TABLE IF EXISTS `drip_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drip_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `steps` json DEFAULT NULL,
  `trigger_event` varchar(100) DEFAULT NULL,
  `trigger_tags` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `drip_campaigns_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drip_campaigns`
--

LOCK TABLES `drip_campaigns` WRITE;
/*!40000 ALTER TABLE `drip_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `drip_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drip_enrollments`
--

DROP TABLE IF EXISTS `drip_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drip_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `current_step` int DEFAULT '0',
  `next_send_at` timestamp NULL DEFAULT NULL,
  `status` enum('active','completed','stopped') DEFAULT 'active',
  `enrolled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `campaign_id` (`campaign_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `drip_enrollments_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `drip_campaigns` (`id`),
  CONSTRAINT `drip_enrollments_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drip_enrollments`
--

LOCK TABLES `drip_enrollments` WRITE;
/*!40000 ALTER TABLE `drip_enrollments` DISABLE KEYS */;
/*!40000 ALTER TABLE `drip_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integrations`
--

DROP TABLE IF EXISTS `integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `type` enum('zoho','hubspot','woocommerce','shopify','zapier','pabbly','google_sheets','google_calendar','openai','razorpay','stripe','payu') DEFAULT NULL,
  `config` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `connected_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `integrations_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integrations`
--

LOCK TABLES `integrations` WRITE;
/*!40000 ALTER TABLE `integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `integrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ivr_call_logs`
--

DROP TABLE IF EXISTS `ivr_call_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ivr_call_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `flow_id` int DEFAULT NULL,
  `caller_number` varchar(20) DEFAULT NULL,
  `key_pressed` varchar(5) DEFAULT NULL,
  `call_duration` int DEFAULT NULL,
  `status` enum('answered','missed','forwarded') DEFAULT NULL,
  `called_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `flow_id` (`flow_id`),
  CONSTRAINT `ivr_call_logs_ibfk_1` FOREIGN KEY (`flow_id`) REFERENCES `ivr_flows` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ivr_call_logs`
--

LOCK TABLES `ivr_call_logs` WRITE;
/*!40000 ALTER TABLE `ivr_call_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `ivr_call_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ivr_flows`
--

DROP TABLE IF EXISTS `ivr_flows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ivr_flows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `did_number` varchar(20) DEFAULT NULL,
  `welcome_audio_url` varchar(500) DEFAULT NULL,
  `menu` json DEFAULT NULL,
  `fallback_number` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `ivr_flows_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ivr_flows`
--

LOCK TABLES `ivr_flows` WRITE;
/*!40000 ALTER TABLE `ivr_flows` DISABLE KEYS */;
INSERT INTO `ivr_flows` VALUES (1,1,'Main IVR','+911234599999',NULL,'[{\"key\": \"1\", \"label\": \"Sales\", \"value\": \"+911234567890\", \"action\": \"forward\"}, {\"key\": \"2\", \"label\": \"Support\", \"value\": \"1\", \"action\": \"chatbot\"}, {\"key\": \"3\", \"label\": \"Business Hours\", \"value\": \"Our business hours are 9 AM to 6 PM, Monday to Saturday.\", \"action\": \"play\"}]',NULL,1,'2026-04-29 08:59:39');
/*!40000 ALTER TABLE `ivr_flows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int DEFAULT NULL,
  `direction` enum('inbound','outbound') DEFAULT NULL,
  `content` text,
  `media_url` varchar(500) DEFAULT NULL,
  `message_type` enum('text','image','video','document','template','interactive','location') DEFAULT NULL,
  `status` enum('sent','delivered','read','failed') DEFAULT 'sent',
  `wa_message_id` varchar(100) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,'inbound','hi',NULL,NULL,'sent',NULL,'2026-04-30 08:34:02'),(2,1,'outbound','Thank you for contacting us!',NULL,NULL,'sent',NULL,'2026-04-30 08:34:02'),(3,1,'inbound','h',NULL,NULL,'sent',NULL,'2026-04-30 08:34:14'),(4,1,'outbound','Welcome! How can I help you today?\n1. Support\n2. Sales\n3. Track Order',NULL,NULL,'sent',NULL,'2026-04-30 08:34:14'),(5,1,'inbound','2',NULL,NULL,'sent',NULL,'2026-04-30 08:34:29'),(6,1,'outbound','Please type your choice (1/2/3)',NULL,NULL,'sent',NULL,'2026-04-30 08:34:29'),(7,1,'inbound','2',NULL,NULL,'sent',NULL,'2026-04-30 08:34:38'),(8,1,'outbound','Our sales team will contact you shortly!',NULL,NULL,'sent',NULL,'2026-04-30 08:34:38'),(9,1,'inbound','kjl',NULL,NULL,'sent',NULL,'2026-04-30 08:37:46'),(10,1,'outbound','Our sales team will contact you shortly!',NULL,NULL,'sent',NULL,'2026-04-30 08:37:46'),(11,1,'outbound','ojoj',NULL,'text','sent',NULL,'2026-04-30 08:38:12'),(12,1,'inbound','hii',NULL,NULL,'sent',NULL,'2026-04-30 08:39:15'),(13,1,'outbound','Thank you for contacting us!',NULL,NULL,'sent',NULL,'2026-04-30 08:39:15'),(14,1,'inbound','ok',NULL,NULL,'sent',NULL,'2026-04-30 08:39:23'),(15,1,'outbound','Welcome! How can I help you today?\n1. Support\n2. Sales\n3. Track Order',NULL,NULL,'sent',NULL,'2026-04-30 08:39:23'),(16,1,'inbound','3',NULL,NULL,'sent',NULL,'2026-04-30 08:39:30'),(17,1,'outbound','Please type your choice (1/2/3)',NULL,NULL,'sent',NULL,'2026-04-30 08:39:30'),(18,1,'inbound','3',NULL,NULL,'sent',NULL,'2026-04-30 08:39:34'),(19,1,'outbound','Please share your order number and we will update you.',NULL,NULL,'sent',NULL,'2026-04-30 08:39:34'),(20,1,'inbound','1123121',NULL,NULL,'sent',NULL,'2026-04-30 08:39:41'),(21,1,'outbound','Please share your order number and we will update you.',NULL,NULL,'sent',NULL,'2026-04-30 08:39:41'),(22,2,'inbound','Hello! This is a test message.',NULL,'text','sent','wamid.test_id_123','2026-05-05 04:25:30'),(23,2,'outbound','Welcome! How can I help you today?\n1. Support\n2. Sales\n3. Track Order',NULL,'text','sent',NULL,'2026-05-05 04:25:31'),(24,2,'inbound','Hello! This is a test message.',NULL,'text','sent','wamid.test_id_123','2026-05-05 06:25:29'),(25,2,'outbound','Please type your choice (1/2/3)',NULL,'text','sent',NULL,'2026-05-05 06:25:30'),(26,2,'inbound','Hello! This is a test message.',NULL,'text','sent','wamid.test_id_123','2026-05-05 06:26:17'),(27,2,'outbound','Thank you for contacting us!',NULL,'text','sent',NULL,'2026-05-05 06:26:18'),(28,2,'inbound','1',NULL,'text','sent','wamid.test_id_123','2026-05-05 06:27:22'),(29,2,'inbound','hi',NULL,'text','sent','wamid.test_id_123','2026-05-05 06:28:46'),(30,2,'outbound','Thank you for contacting us!',NULL,'text','sent',NULL,'2026-05-05 06:28:47'),(31,3,'inbound','Hey',NULL,'text','sent','wamid.unique_test_id_999','2026-05-05 06:30:27'),(32,3,'outbound','Sorry, I could not process your request.',NULL,'text','sent',NULL,'2026-05-05 06:30:27'),(33,3,'inbound','Hi',NULL,'text','sent','wamid.unique_test_id_999','2026-05-05 06:30:57'),(34,3,'outbound','Welcome! How can I help you today?\n1. Support\n2. Sales\n3. Track Order',NULL,'text','sent',NULL,'2026-05-05 06:30:57'),(35,3,'inbound','1',NULL,'text','sent','wamid.unique_test_id_999','2026-05-05 06:31:21'),(36,3,'inbound','1',NULL,'text','sent','wamid.unique_test_id_999','2026-05-05 06:32:17'),(37,4,'outbound','Hello! This is a REAL message sent from your UrbanChat software system. ?',NULL,'text','sent',NULL,'2026-05-05 06:40:59');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opt_in_links`
--

DROP TABLE IF EXISTS `opt_in_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opt_in_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `token` varchar(100) DEFAULT NULL,
  `redirect_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `opt_in_links_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opt_in_links`
--

LOCK TABLES `opt_in_links` WRITE;
/*!40000 ALTER TABLE `opt_in_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `opt_in_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `conversation_id` int DEFAULT NULL,
  `items` json DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `tax` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `payment_gateway` enum('razorpay','stripe','payu') DEFAULT NULL,
  `payment_id` varchar(200) DEFAULT NULL,
  `shipping_address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `price` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rcs_campaigns`
--

DROP TABLE IF EXISTS `rcs_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rcs_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `sender_id` varchar(100) DEFAULT NULL,
  `content` json DEFAULT NULL,
  `target_tags` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','scheduled','running','completed','failed') DEFAULT 'draft',
  `total_sent` int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_read` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `rcs_campaigns_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rcs_campaigns`
--

LOCK TABLES `rcs_campaigns` WRITE;
/*!40000 ALTER TABLE `rcs_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `rcs_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rcs_templates`
--

DROP TABLE IF EXISTS `rcs_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rcs_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `card_type` enum('text','rich_card','carousel','quick_reply') DEFAULT NULL,
  `content` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `rcs_templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rcs_templates`
--

LOCK TABLES `rcs_templates` WRITE;
/*!40000 ALTER TABLE `rcs_templates` DISABLE KEYS */;
INSERT INTO `rcs_templates` VALUES (1,1,'Product Showcase Card','rich_card','{\"title\": \"Check Our Latest Offers!\", \"buttons\": [{\"type\": \"openUrl\", \"label\": \"Shop Now\", \"value\": \"https://urbanchat.in\"}], \"imageUrl\": \"\", \"description\": \"Exclusive deals just for you.\"}','2026-04-29 08:59:39');
/*!40000 ALTER TABLE `rcs_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_campaigns`
--

DROP TABLE IF EXISTS `sms_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `dlt_template_id` varchar(100) DEFAULT NULL,
  `message` text,
  `target_tags` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','scheduled','running','completed','failed') DEFAULT 'draft',
  `total_sent` int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_failed` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `sms_campaigns_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_campaigns`
--

LOCK TABLES `sms_campaigns` WRITE;
/*!40000 ALTER TABLE `sms_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_dlt_templates`
--

DROP TABLE IF EXISTS `sms_dlt_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_dlt_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `dlt_template_id` varchar(100) DEFAULT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `message` text,
  `type` enum('transactional','promotional','otp') DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `sms_dlt_templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_dlt_templates`
--

LOCK TABLES `sms_dlt_templates` WRITE;
/*!40000 ALTER TABLE `sms_dlt_templates` DISABLE KEYS */;
INSERT INTO `sms_dlt_templates` VALUES (1,1,'DLT123456','OTP Template','Your OTP is {#var#}. Valid for 10 minutes. - UrbanChat','otp','approved','2026-04-29 08:59:39');
/*!40000 ALTER TABLE `sms_dlt_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `category` enum('MARKETING','UTILITY','AUTHENTICATION') DEFAULT NULL,
  `language` varchar(10) DEFAULT 'en',
  `header_type` enum('none','text','image','video','document') DEFAULT 'none',
  `header_content` text,
  `body` text,
  `footer` text,
  `buttons` json DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `wa_template_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
INSERT INTO `templates` VALUES (1,1,'welcome_offer','MARKETING','en','none',NULL,'Hi {{1}}! Welcome to UrbanChat. Enjoy 20% off your first order with code URBAN20. Shop now!','Reply STOP to unsubscribe',NULL,'approved',NULL,'2026-04-29 08:59:39'),(2,1,'order_confirmation','UTILITY','en','none',NULL,'Hi {{1}}, your order #{{2}} has been confirmed! Total: ₹{{3}}. We will notify you once shipped.','Thank you for shopping with us!',NULL,'approved',NULL,'2026-04-29 08:59:39');
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('superadmin','admin','agent') DEFAULT 'agent',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'Admin User','admin','$2b$10$YJRh9LWlAjeaYMNkEPQ/HevBUCe0IYxcOIgGIjlCJBJaeX.o9TYuG','admin',1,'2026-04-29 08:59:39'),(2,1,'Agent User','agent@demo.com','$2b$10$fzxVwOpEWG.VBZKo96KV/.aPmglN/X/W93a/oZ5NASioF4QJIRzF6','agent',1,'2026-04-29 08:59:39'),(4,3,'salman s','admin1','$2b$10$p7/mc6bWPDOV8Z1HfZOEEeKawLP3ckgMWFh2MlcA5xc1YRjjfoNM.','admin',1,'2026-04-29 10:17:22'),(5,4,'Salman S ','salmansajeer7@gmail.com','$2b$10$NVQnCvgjTpT7CbV7gpogy.kRuCPaj04vwpPYs5LQ3f80gFCj7z1bq','admin',1,'2026-04-30 03:47:18');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_widgets`
--

DROP TABLE IF EXISTS `website_widgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_widgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `chatbot_id` int DEFAULT NULL,
  `widget_name` varchar(255) DEFAULT NULL,
  `welcome_message` text,
  `brand_color` varchar(7) DEFAULT '#25D366',
  `position` enum('bottom-right','bottom-left') DEFAULT 'bottom-right',
  `allowed_domains` text,
  `widget_token` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widget_token` (`widget_token`),
  KEY `business_id` (`business_id`),
  KEY `chatbot_id` (`chatbot_id`),
  CONSTRAINT `website_widgets_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `website_widgets_ibfk_2` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbots` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_widgets`
--

LOCK TABLES `website_widgets` WRITE;
/*!40000 ALTER TABLE `website_widgets` DISABLE KEYS */;
INSERT INTO `website_widgets` VALUES (1,1,1,'UrbanChat Support','Hi! How can we help you today?','#6C5CE7','bottom-right',NULL,'debdfa7407682141d0e51541e978bdcd',1,'2026-04-30 04:23:17');
/*!40000 ALTER TABLE `website_widgets` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-05 12:19:06
