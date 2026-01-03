package com.poc.support.controller;

import com.poc.support.domain.Message;
import com.poc.support.dto.MessageDto;
import com.poc.support.repository.MessageRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;

    public MessageController(org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate,
            MessageRepository messageRepository) {
        this.messagingTemplate = messagingTemplate;
        this.messageRepository = messageRepository;
    }

    @GetMapping
    public List<Message> getMessages() {
        return messageRepository.findAll();
    }

    @PostMapping
    public Message postMessage(@RequestBody MessageDto messageDto, Authentication authentication) {
        String author = authentication.getName(); // Get username from Security Context
        Message message = new Message(messageDto.getContent(), author);
        Message savedMessage = messageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/messages", savedMessage);
        return savedMessage;
    }
}
