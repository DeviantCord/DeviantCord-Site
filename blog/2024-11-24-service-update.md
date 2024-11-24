---
slug: deviantcord4-beta-service-update
title: DeviantCord 4 Beta Service Update
authors: mriley
tags: [deviantcord4, release, patch notes, bug fix]
---
# DeviantCord Service Update: Ongoing Database Connectivity & API Issues

Dear DeviantCord Users,

We want to provide you with an update regarding persistent service challenges and our recent maintenance efforts.

### Ongoing Database Connection Issues
Over the past few weeks, we've been grappling with persistent TransientConnectionSQL Exceptions in our system. This has been particularly challenging to troubleshoot as each potential solution requires 7-8 hours of observation to verify its effectiveness. We've been methodically testing different approaches, but the intermittent nature of these exceptions has made finding a definitive solution time-consuming.

### Recent Maintenance
On November 23rd at 2AM CST, we completed maintenance on our primary dedicated server to apply the latest updates and patches. During this process, we had to temporarily disable DeviantCord services as we continue to address the TransientConnectionSQL Exceptions.

### Current Troubleshooting Status
In our latest attempt to resolve these database connection issues, we have:
- Reduced our node cluster to a single active node
- Temporarily disabled replication on our production PostgreSQL service

### DeviantArt API Access Issues & Service Adjustments
We're currently experiencing widespread access restrictions to DeviantArt's API, with their CloudFront service blocking requests from approximately two-thirds of our servers. In response, we've relocated the bot program and DBS components to servers that still maintain API access. Currently, only one-third of our infrastructure can successfully communicate with DeviantArt's API. We believe this is a temporary issue and are monitoring the situation closely.

### Infrastructure Note
While the affected servers maintain network redundancy, they currently operate without full power redundancy, relying on limited UPS systems. We are aware of this limitation and are managing it accordingly.

### Important Bug Fix: AllFolders Feature
We have resolved a critical bug affecting the AllFolders feature where listeners were not being properly added to the database. **Action Required**: If you previously set up an allfolder, please verify its presence using the deletefolder command, which will display all active listeners on your server.

### Moving Forward
We understand these ongoing issues may be frustrating, and we appreciate your patience as we work through each potential solution. Our methodical approach, while time-consuming, is necessary to ensure we implement effective, long-term fixes. We anticipate these latest changes will contribute to improved service stability throughout the holiday season.

Our team continues to monitor both the database connection issues and API access situation. We will provide additional updates as we have more information to share.

Thank you for your continued understanding and support.

Best regards,  
The DeviantCord Team